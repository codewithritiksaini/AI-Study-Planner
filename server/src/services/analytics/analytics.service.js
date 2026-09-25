/**
 * analytics.service.js
 *
 * Central analytics aggregation and intelligence coordinator for Phase 9.
 * Queries raw student data safely with RLS isolation and feeds it through
 * pure statistical metric calculators and the deterministic insight engine.
 */

import { query } from '../../config/db.js';
import { appCache } from '../../utils/cache.js';
import {
  calculateStudyMetrics,
  calculatePlannerMetrics,
  calculateQuizMetrics,
  calculateCompletionMetrics,
  getLocalDateString
} from '../metrics/index.js';
import { generateInsights } from './insight.service.js';
import { geminiService } from '../gemini.service.js';

class AnalyticsService {
  /**
   * Resolves the student's configured timezone and local today string.
   */
  async getStudentContext(userId) {
    const profRes = await query(
      `SELECT timezone, daily_available_hours, target_cgpa FROM public.profiles WHERE id = $1;`,
      [userId]
    );
    const timezone = profRes.rows[0]?.timezone || 'UTC';
    const todayStr = getLocalDateString(new Date(), timezone);
    return { timezone, todayStr, profile: profRes.rows[0] || {} };
  }

  /**
   * Helper: Fetches raw data records concurrently for a given user and period.
   */
  async fetchRawData(userId, days, timezone, todayStr) {
    const safeDays = Math.max(1, Math.min(365, Number(days) || 30));

    // Calculate boundary timestamp
    const startDateStr = new Date(new Date(todayStr + 'T00:00:00Z').getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [
      subjectsRes,
      topicsRes,
      sessionsRes,
      plansRes,
      attemptsRes,
      perfRes
    ] = await Promise.all([
      // 1. Subjects
      query(
        `SELECT id, name, color, exam_date, target_score
         FROM public.subjects
         WHERE user_id = $1
         ORDER BY name ASC;`,
        [userId]
      ),
      // 2. Topics with subject info
      query(
        `SELECT t.id, t.subject_id, t.name, t.difficulty, t.estimated_minutes, t.completion_percentage, t.status,
                s.name AS subject_name, s.color AS subject_color
         FROM public.topics t
         JOIN public.subjects s ON t.subject_id = s.id
         WHERE s.user_id = $1
         ORDER BY t.created_at ASC;`,
        [userId]
      ),
      // 3. Study Sessions in the period
      query(
        `SELECT ss.id, ss.subject_id, ss.topic_id, ss.started_at, ss.ended_at, ss.duration_minutes, ss.status,
                s.name AS subject_name, s.color AS subject_color,
                t.name AS topic_name
         FROM public.study_sessions ss
         LEFT JOIN public.subjects s ON ss.subject_id = s.id
         LEFT JOIN public.topics t ON ss.topic_id = t.id
         WHERE ss.user_id = $1
           AND ss.started_at >= ($2::date)
         ORDER BY ss.started_at ASC;`,
        [userId, startDateStr]
      ),
      // 4. Study Plans in the period
      query(
        `SELECT sp.id, sp.subject_id, sp.topic_id, sp.plan_date, sp.planned_minutes, sp.priority_score, sp.reason, sp.status, sp.source,
                s.name AS subject_name, s.color AS subject_color,
                t.name AS topic_name
         FROM public.study_plans sp
         LEFT JOIN public.subjects s ON sp.subject_id = s.id
         LEFT JOIN public.topics t ON sp.topic_id = t.id
         WHERE sp.user_id = $1
           AND sp.plan_date >= ($2::date)
           AND sp.plan_date <= ($3::date)
         ORDER BY sp.plan_date ASC, sp.start_time ASC;`,
        [userId, startDateStr, todayStr]
      ),
      // 5. Quiz Attempts in the period (or all recent attempts)
      query(
        `SELECT qa.id, qa.quiz_id, qa.score, qa.max_score, qa.percentage, qa.submitted_at, qa.created_at,
                q.title AS quiz_title, q.topic_id,
                t.name AS topic_name,
                s.id AS subject_id, s.name AS subject_name
         FROM public.quiz_attempts qa
         JOIN public.quizzes q ON qa.quiz_id = q.id
         JOIN public.topics t ON q.topic_id = t.id
         JOIN public.subjects s ON t.subject_id = s.id
         WHERE qa.user_id = $1 AND qa.status = 'COMPLETED'
         ORDER BY qa.submitted_at ASC;`,
        [userId]
      ),
      // 6. Topic Performance records
      query(
        `SELECT tp.id, tp.topic_id, tp.attempt_count, tp.average_percentage, tp.recent_percentage,
                COALESCE(tp.confidence_score, 0) AS composite_score,
                tp.performance_level,
                t.name AS topic_name,
                s.id AS subject_id, s.name AS subject_name, s.color AS subject_color
         FROM public.topic_performance tp
         JOIN public.topics t ON tp.topic_id = t.id
         JOIN public.subjects s ON t.subject_id = s.id
         WHERE tp.user_id = $1;`,
        [userId]
      )
    ]);

    return {
      safeDays,
      startDateStr,
      todayStr,
      subjects: subjectsRes.rows,
      topics: topicsRes.rows,
      studySessions: sessionsRes.rows,
      studyPlans: plansRes.rows,
      quizAttempts: attemptsRes.rows,
      topicPerformances: perfRes.rows
    };
  }

  /**
   * GET /api/analytics/overview?days=30
   * High-performance single aggregation endpoint for initial dashboard load.
   */
  async getOverview({ userId, days = 30 }) {
    const cacheKey = `user:${userId}:analytics:overview:${days}`;
    return appCache.getOrSet(cacheKey, async () => {
      const { timezone, todayStr } = await this.getStudentContext(userId);
      const raw = await this.fetchRawData(userId, days, timezone, todayStr);

      // 1. Calculate pure statistical metrics
      const studyMetrics = calculateStudyMetrics(raw.studySessions, raw.safeDays, timezone, todayStr);
      const plannerMetrics = calculatePlannerMetrics(raw.studyPlans, raw.studySessions, raw.safeDays, timezone, todayStr);
      const quizMetrics = calculateQuizMetrics(raw.quizAttempts, timezone);
      const completionMetrics = calculateCompletionMetrics(raw.topics, raw.subjects, timezone, todayStr);

      // 2. Evaluate deterministic educational insights
      const insights = generateInsights({
        studyMetrics,
        plannerMetrics,
        quizMetrics,
        completionMetrics,
        topicPerformances: raw.topicPerformances,
        subjects: raw.subjects,
        studySessions: raw.studySessions,
        referenceDate: todayStr
      });

      return {
        period: {
          days: raw.safeDays,
          start_date: raw.startDateStr,
          end_date: todayStr
        },
        study: studyMetrics,
        planner: plannerMetrics,
        quiz: quizMetrics,
        academic: completionMetrics,
        subjects: completionMetrics.subjects,
        topics: raw.topics,
        insights
      };
    }, 45);
  }

  /**
   * GET /api/analytics/study?days=30
   */
  async getStudyAnalytics({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);
    return calculateStudyMetrics(raw.studySessions, raw.safeDays, timezone, todayStr);
  }

  /**
   * GET /api/analytics/academic?days=30
   */
  async getAcademicAnalytics({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);
    return calculateCompletionMetrics(raw.topics, raw.subjects, timezone, todayStr);
  }

  /**
   * GET /api/analytics/quiz?days=30
   */
  async getQuizAnalytics({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);
    return calculateQuizMetrics(raw.quizAttempts, timezone);
  }

  /**
   * GET /api/analytics/planner?days=30
   */
  async getPlannerAnalytics({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);
    return calculatePlannerMetrics(raw.studyPlans, raw.studySessions, raw.safeDays, timezone, todayStr);
  }

  /**
   * GET /api/analytics/trends?days=30
   */
  async getTrends({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);

    const studyMetrics = calculateStudyMetrics(raw.studySessions, raw.safeDays, timezone, todayStr);
    const plannerMetrics = calculatePlannerMetrics(raw.studyPlans, raw.studySessions, raw.safeDays, timezone, todayStr);
    const quizMetrics = calculateQuizMetrics(raw.quizAttempts, timezone);

    return {
      period: {
        days: raw.safeDays,
        start_date: raw.startDateStr,
        end_date: todayStr
      },
      study_trend: studyMetrics.daily,
      quiz_trend: quizMetrics.daily,
      planner_trend: plannerMetrics.daily
    };
  }

  /**
   * GET /api/analytics/insights?days=30
   */
  async getInsights({ userId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);
    const raw = await this.fetchRawData(userId, days, timezone, todayStr);

    const studyMetrics = calculateStudyMetrics(raw.studySessions, raw.safeDays, timezone, todayStr);
    const plannerMetrics = calculatePlannerMetrics(raw.studyPlans, raw.studySessions, raw.safeDays, timezone, todayStr);
    const quizMetrics = calculateQuizMetrics(raw.quizAttempts, timezone);
    const completionMetrics = calculateCompletionMetrics(raw.topics, raw.subjects, timezone, todayStr);

    return generateInsights({
      studyMetrics,
      plannerMetrics,
      quizMetrics,
      completionMetrics,
      topicPerformances: raw.topicPerformances,
      subjects: raw.subjects,
      studySessions: raw.studySessions,
      referenceDate: todayStr
    });
  }

  /**
   * GET /api/analytics/subjects/:subjectId?days=30
   * Detailed breakdown for a single subject.
   */
  async getSubjectAnalytics({ userId, subjectId, days = 30 }) {
    const { timezone, todayStr } = await this.getStudentContext(userId);

    // 1. Verify subject ownership
    const subRes = await query(
      `SELECT id, name, color, exam_date, target_score
       FROM public.subjects
       WHERE id = $1 AND user_id = $2;`,
      [subjectId, userId]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Subject not found or unauthorized.');
      err.code = 'SUBJECT_ANALYTICS_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const subject = subRes.rows[0];

    // 2. Fetch topics for this subject
    const topicsRes = await query(
      `SELECT id, name, difficulty, estimated_minutes, completion_percentage, status
       FROM public.topics
       WHERE subject_id = $1
       ORDER BY created_at ASC;`,
      [subjectId]
    );
    const topics = topicsRes.rows;

    // 3. Fetch study sessions for this subject
    const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
    const startDateStr = new Date(new Date(todayStr + 'T00:00:00Z').getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const sessRes = await query(
      `SELECT duration_minutes, started_at
       FROM public.study_sessions
       WHERE subject_id = $1 AND user_id = $2 AND started_at >= ($3::date);`,
      [subjectId, userId, startDateStr]
    );

    const totalStudyMins = sessRes.rows.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);

    // 4. Fetch quiz attempts for this subject's topics
    const attemptsRes = await query(
      `SELECT qa.percentage, qa.submitted_at
       FROM public.quiz_attempts qa
       JOIN public.quizzes q ON qa.quiz_id = q.id
       JOIN public.topics t ON q.topic_id = t.id
       WHERE t.subject_id = $1 AND qa.user_id = $2 AND qa.status = 'COMPLETED'
       ORDER BY qa.submitted_at ASC;`,
      [subjectId, userId]
    );

    const quizMetrics = calculateQuizMetrics(attemptsRes.rows, timezone);
    const completionMetrics = calculateCompletionMetrics(topics, [subject], timezone, todayStr);

    // 5. Fetch weak topics for this subject
    const weakRes = await query(
      `SELECT tp.topic_id, t.name AS topic_name, tp.performance_level,
              COALESCE(tp.confidence_score, 0) AS composite_score
       FROM public.topic_performance tp
       JOIN public.topics t ON tp.topic_id = t.id
       WHERE t.subject_id = $1 AND tp.user_id = $2
         AND (tp.performance_level = 'WEAK' OR COALESCE(tp.confidence_score, 0) < 50);`,
      [subjectId, userId]
    );

    return {
      subject: {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        exam_date: subject.exam_date,
        target_score: subject.target_score
      },
      progress: completionMetrics.subjects[0] || {},
      study_minutes: totalStudyMins,
      study_hours: Number((totalStudyMins / 60).toFixed(1)),
      quiz_metrics: quizMetrics,
      weak_topics: weakRes.rows,
      topics_count: topics.length,
      topics
    };
  }

  /**
   * GET /api/analytics/topics/:topicId
   * Detailed breakdown for a single topic.
   */
  async getTopicAnalytics({ userId, topicId }) {
    // 1. Verify topic ownership via subject join
    const topRes = await query(
      `SELECT t.id, t.name, t.difficulty, t.estimated_minutes, t.completion_percentage, t.status,
              s.id AS subject_id, s.name AS subject_name, s.color AS subject_color
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE t.id = $1 AND s.user_id = $2;`,
      [topicId, userId]
    );

    if (topRes.rows.length === 0) {
      const err = new Error('Topic not found or unauthorized.');
      err.code = 'TOPIC_ANALYTICS_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const topic = topRes.rows[0];

    // 2. Fetch topic study sessions
    const sessRes = await query(
      `SELECT id, started_at, duration_minutes, notes, confidence_level, difficulty_feedback
       FROM public.study_sessions
       WHERE topic_id = $1 AND user_id = $2 AND status = 'COMPLETED'
       ORDER BY started_at DESC;`,
      [topicId, userId]
    );

    const totalStudyMins = sessRes.rows.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0);
    const lastSession = sessRes.rows[0] || null;

    // 3. Fetch topic performance and quiz attempts
    const [perfRes, attemptsRes] = await Promise.all([
      query(
        `SELECT attempt_count, average_percentage, recent_percentage,
                COALESCE(confidence_score, 0) AS composite_score,
                performance_level, last_attempted_at
         FROM public.topic_performance
         WHERE topic_id = $1 AND user_id = $2;`,
        [topicId, userId]
      ),
      query(
        `SELECT qa.id, qa.percentage, qa.score, qa.max_score, qa.submitted_at
         FROM public.quiz_attempts qa
         JOIN public.quizzes q ON qa.quiz_id = q.id
         WHERE q.topic_id = $1 AND qa.user_id = $2 AND qa.status = 'COMPLETED'
         ORDER BY qa.submitted_at ASC;`,
        [topicId, userId]
      )
    ]);

    const performance = perfRes.rows[0] || null;
    const quizMetrics = calculateQuizMetrics(attemptsRes.rows);

    return {
      topic,
      study: {
        total_minutes: totalStudyMins,
        total_hours: Number((totalStudyMins / 60).toFixed(1)),
        sessions_count: sessRes.rows.length,
        last_studied_at: lastSession?.started_at || null
      },
      performance,
      quiz_metrics: quizMetrics,
      attempts: attemptsRes.rows
    };
  }

  /**
   * POST /api/analytics/explain-insights
   * Converts structured deterministic insights into friendly natural-language advice using Gemini.
   * If Gemini is disabled or errors out, returns deterministic fallback immediately.
   */
  async explainInsights({ userId, days = 30 }) {
    const overview = await this.getOverview({ userId, days });
    const deterministicInsights = overview.insights || [];

    if (deterministicInsights.length === 0) {
      return {
        summary: 'Your analytics indicate steady study progression. Keep logging study sessions and practicing quizzes to generate insights.',
        insights: [],
        source: 'FALLBACK_RULE_ENGINE'
      };
    }

    try {
      const promptText = `
You are an academic mentor reviewing a student's verified analytics over the last ${days} days.
Here are the student's structured deterministic analytics metrics and top insights:

Metrics:
- Total Study Hours: ${overview.study.total_hours}h (${overview.study.active_days} active days of ${overview.period.days})
- Study Consistency: ${overview.study.consistency_percentage}%
- Current Streak: ${overview.study.current_streak} days
- Plan Adherence: ${overview.planner.adherence_percentage}% (${overview.planner.actual_hours}h completed / ${overview.planner.planned_hours}h planned)
- Overall Syllabus Covered: ${overview.academic.overall_completion_percentage}%
- Quiz Average: ${overview.quiz.available ? `${overview.quiz.average_score}% (${overview.quiz.trend})` : 'No quizzes completed yet'}

Top Educational Insights:
${deterministicInsights.map((ins, i) => `${i + 1}. [${ins.type}] ${ins.title}: ${ins.message}`).join('\n')}

Task:
Convert these structured facts into a warm, constructive, and concise academic summary.
Strict Rules:
- Return valid JSON matching schema: {"summary": "string", "insights": [{"title": "string", "message": "string"}]}
- DO NOT invent numbers or contradict the metrics above.
- Maintain an encouraging and objective tone.
`;

      const aiResponse = await geminiService.generateContent({
        prompt: promptText,
        systemInstruction: 'You are an encouraging academic mentor. Explain verified student progress metrics factually and warmly without inventing statistics.',
        expectJson: true
      });

      if (aiResponse && aiResponse.summary && Array.isArray(aiResponse.insights)) {
        return {
          ...aiResponse,
          source: 'GEMINI_AI'
        };
      }
      throw new Error('Invalid AI response schema');
    } catch (err) {
      console.warn('⚠️ Gemini insight explanation unavailable, returning deterministic fallback:', err.message);
      return {
        summary: `Over the last ${days} days, you logged ${overview.study.total_hours}h of study across ${overview.study.active_days} active days with ${overview.planner.adherence_percentage}% plan adherence.`,
        insights: deterministicInsights.map(ins => ({ title: ins.title, message: ins.message })),
        source: 'FALLBACK_RULE_ENGINE'
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
