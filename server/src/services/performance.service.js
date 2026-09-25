import { query } from '../config/db.js';
import { PERFORMANCE_CONFIG } from '../config/performance.config.js';

class PerformanceService {
  /**
   * Deterministically classifies a percentage score into a performance tier.
   *
   * @param {number} score - Percentage score (0 - 100)
   * @returns {'WEAK' | 'NEEDS_PRACTICE' | 'AVERAGE' | 'STRONG'}
   */
  classifyScore(score) {
    const val = Number(score) || 0;
    if (val < PERFORMANCE_CONFIG.thresholds.WEAK) {
      return PERFORMANCE_CONFIG.levels.WEAK;
    }
    if (val < PERFORMANCE_CONFIG.thresholds.NEEDS_PRACTICE) {
      return PERFORMANCE_CONFIG.levels.NEEDS_PRACTICE;
    }
    if (val < PERFORMANCE_CONFIG.thresholds.AVERAGE) {
      return PERFORMANCE_CONFIG.levels.AVERAGE;
    }
    return PERFORMANCE_CONFIG.levels.STRONG;
  }

  /**
   * Recalculates and upserts topic performance based on all completed quiz attempts for that topic.
   * Uses weighted historical + recent formula ($0.60 recent + $0.40 historical).
   *
   * @param {string} userId - UUID
   * @param {string} topicId - UUID
   * @returns {Promise<Object>} Updated topic_performance row
   */
  async updateTopicPerformance(userId, topicId) {
    // 1. Verify topic and retrieve subject_id
    const topicRes = await query(
      `SELECT t.id, t.subject_id, t.name AS topic_name, s.name AS subject_name
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE t.id = $1 AND s.user_id = $2;`,
      [topicId, userId]
    );

    if (topicRes.rows.length === 0) {
      const err = new Error('Topic not found or unauthorized.');
      err.code = 'TOPIC_ACCESS_DENIED';
      err.statusCode = 404;
      throw err;
    }

    const { subject_id } = topicRes.rows[0];

    // 2. Fetch all completed attempts for quizzes associated with this topic
    const attemptsRes = await query(
      `SELECT 
          qa.id,
          qa.percentage,
          qa.score,
          qa.max_score,
          qa.correct_count,
          qa.incorrect_count,
          qa.unanswered_count,
          qa.submitted_at
       FROM public.quiz_attempts qa
       JOIN public.quizzes q ON qa.quiz_id = q.id
       WHERE q.topic_id = $1 AND qa.user_id = $2 AND qa.status = 'COMPLETED'
       ORDER BY qa.submitted_at DESC;`,
      [topicId, userId]
    );

    const attempts = attemptsRes.rows;

    if (attempts.length === 0) {
      // No completed attempts yet for this topic
      return null;
    }

    const attemptCount = attempts.length;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let sumPercentages = 0;

    for (const att of attempts) {
      const qCount = (Number(att.correct_count) || 0) + 
                     (Number(att.incorrect_count) || 0) + 
                     (Number(att.unanswered_count) || 0);
      totalQuestions += qCount;
      totalCorrect += Number(att.correct_count) || 0;
      sumPercentages += Number(att.percentage) || 0;
    }

    // Historical average percentage across all completed attempts
    const averagePercentage = Number((sumPercentages / attemptCount).toFixed(2));

    // Recent performance: average of most recent up to 3 attempts
    const recentWindow = attempts.slice(0, PERFORMANCE_CONFIG.recentWindowSize);
    const recentSum = recentWindow.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    const recentPercentage = Number((recentSum / recentWindow.length).toFixed(2));

    // Weighted composite mastery score
    let compositeScore = 0;
    if (attemptCount === 1) {
      compositeScore = recentPercentage;
    } else {
      compositeScore = Number((
        recentPercentage * PERFORMANCE_CONFIG.weights.recent +
        averagePercentage * PERFORMANCE_CONFIG.weights.historical
      ).toFixed(2));
    }

    // Determine performance level
    const performanceLevel = this.classifyScore(compositeScore);

    // Confidence score: based on attempt count consistency and mastery
    // Scales towards compositeScore as attempts increase
    const sampleWeight = Math.min(attemptCount / 3, 1.0); // full confidence after 3 attempts
    const confidenceScore = Number((compositeScore * sampleWeight).toFixed(2));

    const lastAttemptedAt = attempts[0].submitted_at;

    // 3. Upsert into topic_performance
    const upsertRes = await query(
      `INSERT INTO public.topic_performance (
          user_id,
          subject_id,
          topic_id,
          attempt_count,
          total_questions,
          correct_answers,
          average_percentage,
          recent_percentage,
          performance_level,
          confidence_score,
          last_attempted_at,
          updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, timezone('utc'::text, now()))
       ON CONFLICT (user_id, topic_id) DO UPDATE SET
          attempt_count = EXCLUDED.attempt_count,
          total_questions = EXCLUDED.total_questions,
          correct_answers = EXCLUDED.correct_answers,
          average_percentage = EXCLUDED.average_percentage,
          recent_percentage = EXCLUDED.recent_percentage,
          performance_level = EXCLUDED.performance_level,
          confidence_score = EXCLUDED.confidence_score,
          last_attempted_at = EXCLUDED.last_attempted_at,
          updated_at = timezone('utc'::text, now())
       RETURNING *;`,
      [
        userId,
        subject_id,
        topicId,
        attemptCount,
        totalQuestions,
        totalCorrect,
        averagePercentage,
        recentPercentage,
        performanceLevel,
        confidenceScore,
        lastAttemptedAt
      ]
    );

    return upsertRes.rows[0];
  }

  /**
   * Retrieves topic performance records for a user with optional subject filter.
   */
  async getTopicPerformance(userId, subjectId = null) {
    let queryText = `
      SELECT 
        tp.*,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.completion_percentage,
        t.status AS topic_status,
        s.name AS subject_name,
        s.color AS subject_color
      FROM public.topic_performance tp
      JOIN public.topics t ON tp.topic_id = t.id
      JOIN public.subjects s ON tp.subject_id = s.id
      WHERE tp.user_id = $1
    `;
    const params = [userId];

    if (subjectId) {
      queryText += ' AND tp.subject_id = $2';
      params.push(subjectId);
    }

    queryText += ' ORDER BY tp.updated_at DESC;';

    const res = await query(queryText, params);
    return res.rows;
  }

  /**
   * Retrieves performance details for an individual topic.
   */
  async getTopicPerformanceById(userId, topicId) {
    const res = await query(
      `SELECT 
        tp.*,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.completion_percentage,
        t.status AS topic_status,
        s.name AS subject_name,
        s.color AS subject_color
      FROM public.topic_performance tp
      JOIN public.topics t ON tp.topic_id = t.id
      JOIN public.subjects s ON tp.subject_id = s.id
      WHERE tp.user_id = $1 AND tp.topic_id = $2;`,
      [userId, topicId]
    );

    if (res.rows.length === 0) {
      // Check if topic exists for this user
      const topicCheck = await query(
        `SELECT t.id, t.name AS topic_name, t.difficulty AS topic_difficulty,
                t.completion_percentage, t.status AS topic_status,
                s.id AS subject_id, s.name AS subject_name, s.color AS subject_color
         FROM public.topics t
         JOIN public.subjects s ON t.subject_id = s.id
         WHERE t.id = $1 AND s.user_id = $2;`,
        [topicId, userId]
      );

      if (topicCheck.rows.length === 0) {
        return null;
      }

      const t = topicCheck.rows[0];
      return {
        id: null,
        user_id: userId,
        subject_id: t.subject_id,
        topic_id: t.id,
        attempt_count: 0,
        total_questions: 0,
        correct_answers: 0,
        average_percentage: 0,
        recent_percentage: null,
        performance_level: 'NOT_ASSESSED',
        confidence_score: 0,
        last_attempted_at: null,
        topic_name: t.topic_name,
        topic_difficulty: t.topic_difficulty,
        completion_percentage: t.completion_percentage,
        topic_status: t.topic_status,
        subject_name: t.subject_name,
        subject_color: t.subject_color
      };
    }
    return res.rows[0];
  }

  /**
   * Retrieves weak topics (WEAK or NEEDS_PRACTICE) requiring student attention.
   */
  async getWeakTopics(userId) {
    const res = await query(
      `SELECT 
        tp.*,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.completion_percentage,
        s.name AS subject_name,
        s.color AS subject_color
      FROM public.topic_performance tp
      JOIN public.topics t ON tp.topic_id = t.id
      JOIN public.subjects s ON tp.subject_id = s.id
      WHERE tp.user_id = $1 AND tp.performance_level IN ('WEAK', 'NEEDS_PRACTICE')
      ORDER BY tp.recent_percentage ASC, tp.attempt_count DESC;`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Retrieves strong topics (STRONG mastery level).
   */
  async getStrongTopics(userId) {
    const res = await query(
      `SELECT 
        tp.*,
        t.name AS topic_name,
        t.difficulty AS topic_difficulty,
        t.completion_percentage,
        s.name AS subject_name,
        s.color AS subject_color
      FROM public.topic_performance tp
      JOIN public.topics t ON tp.topic_id = t.id
      JOIN public.subjects s ON tp.subject_id = s.id
      WHERE tp.user_id = $1 AND tp.performance_level = 'STRONG'
      ORDER BY tp.recent_percentage DESC;`,
      [userId]
    );
    return res.rows;
  }
}

export const performanceService = new PerformanceService();
