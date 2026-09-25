import { query } from '../config/db.js';
import { AI_CONFIG } from '../config/ai.config.js';

/**
 * AI Context Service
 * Extracts minimal, feature-specific student context from PostgreSQL.
 * Strictly avoids leaking credentials, emails, auth tokens, or unrelated database records.
 * Sanitizes user-provided text to defend against prompt injection.
 */
class AIContextService {
  /**
   * Sanitizes string inputs to prevent prompt injection or markdown corruption.
   */
  sanitizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove control chars
      .replace(/[`${}\\]/g, ' ') // neutralise template escapes
      .trim();
  }

  /**
   * Builds compact context for daily study recommendations.
   * Gathers: daily availability, upcoming exams, incomplete topics, recent sessions, today's existing plan.
   */
  async buildRecommendationContext(userId, dateStr) {
    const planningDate = dateStr || new Date().toISOString().split('T')[0];

    // 1. Student profile availability
    const profRes = await query(
      `SELECT daily_available_hours, preferred_study_start_time, preferred_study_end_time, timezone
       FROM public.profiles WHERE id = $1;`,
      [userId]
    );
    const profile = profRes.rows[0] || {};

    // 2. Upcoming exams for enrolled subjects (next 45 days)
    const subjRes = await query(
      `SELECT id, name, exam_date, target_score
       FROM public.subjects
       WHERE user_id = $1
       ORDER BY exam_date ASC NULLS LAST;`,
      [userId]
    );

    // 3. Incomplete topics
    const topicRes = await query(
      `SELECT t.id, t.name, t.difficulty, t.estimated_minutes, t.completion_percentage, s.name AS subject_name
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE s.user_id = $1
         AND t.status != 'COMPLETED'
         AND (t.completion_percentage IS NULL OR t.completion_percentage < 100)
       ORDER BY t.created_at ASC
       LIMIT $2;`,
      [userId, AI_CONFIG.constraints.maxTopicsInContext]
    );

    // 4. Recent completed study sessions
    const sessRes = await query(
      `SELECT ss.duration_minutes, ss.confidence_level, ss.difficulty_feedback, ss.started_at,
              s.name AS subject_name, t.name AS topic_name
       FROM public.study_sessions ss
       LEFT JOIN public.subjects s ON ss.subject_id = s.id
       LEFT JOIN public.topics t ON ss.topic_id = t.id
       WHERE ss.user_id = $1 AND ss.status = 'COMPLETED'
       ORDER BY ss.started_at DESC
       LIMIT $2;`,
      [userId, AI_CONFIG.constraints.maxRecentSessionsInContext]
    );

    // 5. Existing planned study blocks for this date
    const planRes = await query(
      `SELECT p.id, p.planned_minutes, p.priority_score, p.reason, p.status,
              s.name AS subject_name, t.name AS topic_name
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC;`,
      [userId, planningDate]
    );

    return {
      date: planningDate,
      available_hours: Number(profile.daily_available_hours) || 2,
      study_window: `${profile.preferred_study_start_time || '18:00'} to ${profile.preferred_study_end_time || '22:00'}`,
      subjects: (subjRes.rows || []).map(s => ({
        id: s.id,
        name: this.sanitizeText(s.name),
        exam_date: s.exam_date,
        target_score: s.target_score
      })),
      incomplete_topics: (topicRes.rows || []).map(t => ({
        id: t.id,
        name: this.sanitizeText(t.name),
        subject: this.sanitizeText(t.subject_name),
        difficulty: t.difficulty,
        estimated_minutes: t.estimated_minutes,
        completion_percentage: t.completion_percentage || 0
      })),
      recent_activity: (sessRes.rows || []).map(ss => ({
        subject: this.sanitizeText(ss.subject_name),
        topic: this.sanitizeText(ss.topic_name),
        duration_minutes: ss.duration_minutes,
        confidence: ss.confidence_level,
        feedback: ss.difficulty_feedback,
        studied_at: ss.started_at ? ss.started_at.toISOString().split('T')[0] : null
      })),
      today_plan: (planRes.rows || []).map(p => ({
        subject: this.sanitizeText(p.subject_name),
        topic: this.sanitizeText(p.topic_name),
        planned_minutes: p.planned_minutes,
        priority_score: p.priority_score,
        reason: this.sanitizeText(p.reason),
        status: p.status
      }))
    };
  }

  /**
   * Builds context for explaining a specific date's generated plan.
   */
  async buildExplainPlanContext(userId, dateStr) {
    const planningDate = dateStr || new Date().toISOString().split('T')[0];

    const planRes = await query(
      `SELECT p.id, p.planned_minutes, p.priority_score, p.reason, p.status, p.start_time, p.end_time,
              s.name AS subject_name, s.exam_date,
              t.name AS topic_name, t.difficulty, t.completion_percentage
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY p.start_time ASC;`,
      [userId, planningDate]
    );

    const profRes = await query(
      `SELECT daily_available_hours, preferred_study_start_time, preferred_study_end_time
       FROM public.profiles WHERE id = $1;`,
      [userId]
    );

    return {
      date: planningDate,
      daily_capacity_hours: Number(profRes.rows[0]?.daily_available_hours) || 2,
      scheduled_tasks: (planRes.rows || []).map(p => ({
        subject: this.sanitizeText(p.subject_name),
        topic: this.sanitizeText(p.topic_name),
        planned_minutes: p.planned_minutes,
        priority_score: Number(p.priority_score),
        rule_reason: this.sanitizeText(p.reason),
        exam_date: p.exam_date,
        difficulty: p.difficulty,
        completion_percentage: p.completion_percentage,
        time_slot: p.start_time && p.end_time
          ? `${new Date(p.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(p.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : null
      }))
    };
  }

  /**
   * Builds context for a specific topic's study strategy.
   * Strictly enforces topic ownership by the authenticated user.
   */
  async buildStudyStrategyContext(userId, topicId) {
    const res = await query(
      `SELECT t.id, t.name AS topic_name, t.difficulty, t.estimated_minutes, t.completion_percentage,
              s.id AS subject_id, s.name AS subject_name, s.exam_date, s.target_score
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE t.id = $1 AND s.user_id = $2;`,
      [topicId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Topic not found or does not belong to the authenticated student.');
      err.code = 'TOPIC_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const item = res.rows[0];

    // Fetch recent study history on this specific topic
    const sessRes = await query(
      `SELECT duration_minutes, confidence_level, difficulty_feedback, started_at
       FROM public.study_sessions
       WHERE topic_id = $1 AND user_id = $2 AND status = 'COMPLETED'
       ORDER BY started_at DESC
       LIMIT 3;`,
      [topicId, userId]
    );

    return {
      subject: this.sanitizeText(item.subject_name),
      topic: this.sanitizeText(item.topic_name),
      difficulty: item.difficulty,
      estimated_minutes: item.estimated_minutes || 45,
      completion_percentage: item.completion_percentage || 0,
      exam_date: item.exam_date,
      target_score: item.target_score,
      past_sessions: (sessRes.rows || []).map(s => ({
        duration_minutes: s.duration_minutes,
        confidence: s.confidence_level,
        feedback: s.difficulty_feedback
      }))
    };
  }
}

export const aiContextService = new AIContextService();
