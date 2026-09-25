/**
 * scheduling-context.service.js
 *
 * Efficiently aggregates and structures all student data required for Phase 11 scheduling:
 * - Student preferences (timezone, daily availability, study bounds)
 * - Weekly availability schedule (public.study_availability)
 * - Blocked periods (public.blocked_periods)
 * - Enrolled subjects and upcoming exam deadlines
 * - Curriculum topics and prerequisites (public.topic_prerequisites)
 * - Active Phase 10 recommendations (public.recommendations)
 * - Backlog missed study tasks
 * - Existing scheduled study plans (locked, completed, in-progress)
 * - Historical observed capacity and adherence from Phase 9 pure metric services
 */

import { query } from '../../config/db.js';
import {
  calculateStudyMetrics,
  calculatePlannerMetrics,
  getLocalDateString
} from '../metrics/index.js';
import { schedulerConfig } from '../../config/scheduler.config.js';

/**
 * Calculates calendar days between two YYYY-MM-DD date strings.
 */
function getDaysDiff(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return null;
  const fromTime = new Date(fromDateStr + 'T00:00:00Z').getTime();
  const toTime = new Date(toDateStr + 'T00:00:00Z').getTime();
  return Math.round((toTime - fromTime) / (24 * 60 * 60 * 1000));
}

/**
 * Aggregates complete SchedulingContext in a single parallel database roundtrip.
 *
 * @param {string} userId - UUID of authenticated student
 * @param {Object} [options]
 * @param {string} [options.periodStart] - Schedule start date (YYYY-MM-DD)
 * @param {string} [options.periodEnd] - Schedule end date (YYYY-MM-DD)
 * @param {number} [options.lookbackDays=14] - Historical lookback for capacity metrics
 * @returns {Promise<Object>} Unified SchedulingContext
 */
export async function buildSchedulingContext(userId, options = {}) {
  // 1. Fetch user profile for timezone and study preferences
  const profileRes = await query(
    `SELECT id, full_name, email, branch, semester, target_cgpa, 
            daily_available_hours, preferred_study_start_time, preferred_study_end_time,
            timezone, created_at
     FROM public.profiles
     WHERE id = $1 LIMIT 1;`,
    [userId]
  );

  const profile = profileRes.rows[0] || {};
  const timezone = profile.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), timezone);

  const periodStart = options.periodStart || todayStr;
  const periodEnd = options.periodEnd || new Date(
    new Date(periodStart + 'T00:00:00Z').getTime() + 6 * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  const lookbackDays = Math.max(7, Math.min(30, Number(options.lookbackDays) || schedulerConfig.CAPACITY_ADAPTATION.LOOKBACK_DAYS));
  const lookbackStartDateStr = new Date(
    new Date(todayStr + 'T00:00:00Z').getTime() - (lookbackDays - 1) * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  // 2. Fetch all raw scheduling entities in parallel (1 database roundtrip)
  const [
    availabilityRes,
    blockedRes,
    subjectsRes,
    topicsRes,
    prereqRes,
    recommendationsRes,
    existingPlansRes,
    backlogPlansRes,
    historicalSessionsRes,
    historicalPlansRes
  ] = await Promise.all([
    // Availability
    query(
      `SELECT id, day_of_week, start_time, end_time, is_active
       FROM public.study_availability
       WHERE user_id = $1 AND is_active = true
       ORDER BY day_of_week ASC, start_time ASC;`,
      [userId]
    ),
    // Blocked periods
    query(
      `SELECT id, day_of_week, date, start_time, end_time, reason
       FROM public.blocked_periods
       WHERE user_id = $1
       ORDER BY start_time ASC;`,
      [userId]
    ),
    // Subjects
    query(
      `SELECT id, name, color, target_score, exam_date
       FROM public.subjects
       WHERE user_id = $1
       ORDER BY name ASC;`,
      [userId]
    ),
    // Topics
    query(
      `SELECT t.id, t.subject_id, t.name, t.description, t.difficulty,
              t.estimated_minutes, t.status, t.completion_percentage,
              s.name AS subject_name, s.color AS subject_color
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE s.user_id = $1
       ORDER BY t.name ASC;`,
      [userId]
    ),
    // Topic Prerequisites
    query(
      `SELECT p.topic_id, p.prerequisite_topic_id
       FROM public.topic_prerequisites p
       JOIN public.topics t ON p.topic_id = t.id
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE s.user_id = $1;`,
      [userId]
    ),
    // Active Recommendations (Phase 10)
    query(
      `SELECT id, type, priority, priority_score, title, message,
              action_json, reason_json, estimated_minutes,
              subject_id, topic_id
       FROM public.recommendations
       WHERE user_id = $1 AND status = 'ACTIVE'
       ORDER BY priority_score DESC;`,
      [userId]
    ),
    // Existing Plans in Period
    query(
      `SELECT p.id, p.subject_id, p.topic_id, p.plan_date, p.start_time, p.end_time,
              p.planned_minutes, p.priority_score, p.status, p.is_locked,
              p.generation_id, p.custom_title, p.task_source,
              s.name AS subject_name, s.color AS subject_color, t.name AS topic_name
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.plan_date >= $2 AND p.plan_date <= $3
       ORDER BY p.plan_date ASC, p.start_time ASC NULLS LAST;`,
      [userId, periodStart, periodEnd]
    ),
    // Backlog (Missed plans before today)
    query(
      `SELECT p.id, p.subject_id, p.topic_id, p.plan_date, p.planned_minutes,
              p.priority_score, p.reason, s.name AS subject_name, t.name AS topic_name
       FROM public.study_plans p
       LEFT JOIN public.subjects s ON p.subject_id = s.id
       LEFT JOIN public.topics t ON p.topic_id = t.id
       WHERE p.user_id = $1 AND p.status = 'MISSED' AND p.plan_date < $2
       ORDER BY p.plan_date DESC;`,
      [userId, todayStr]
    ),
    // Historical Sessions (Last lookback days)
    query(
      `SELECT id, subject_id, topic_id, duration_minutes, started_at
       FROM public.study_sessions
       WHERE user_id = $1 AND started_at >= $2
       ORDER BY started_at ASC;`,
      [userId, lookbackStartDateStr]
    ),
    // Historical Plans (Last lookback days)
    query(
      `SELECT id, plan_date, planned_minutes, status
       FROM public.study_plans
       WHERE user_id = $1 AND plan_date >= $2
       ORDER BY plan_date ASC;`,
      [userId, lookbackStartDateStr]
    )
  ]);

  // 3. Process Subjects with Exam Deadlines
  const subjects = subjectsRes.rows.map((sub) => {
    let daysUntilExam = null;
    let examDateStr = null;
    if (sub.exam_date) {
      examDateStr = new Date(sub.exam_date).toISOString().split('T')[0];
      daysUntilExam = getDaysDiff(todayStr, examDateStr);
    }
    return {
      ...sub,
      exam_date_str: examDateStr,
      days_until_exam: daysUntilExam,
      is_exam_urgent: daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= schedulerConfig.DEADLINE_URGENCY.HIGH_DAYS
    };
  });

  // 4. Map Topic Prerequisites
  const prereqMap = new Map();
  for (const row of prereqRes.rows) {
    if (!prereqMap.has(row.topic_id)) {
      prereqMap.set(row.topic_id, []);
    }
    prereqMap.get(row.topic_id).push(row.prerequisite_topic_id);
  }

  const topics = topicsRes.rows.map((topic) => {
    const remainingPct = Math.max(0, 100 - Number(topic.completion_percentage || 0));
    const estimatedMins = Number(topic.estimated_minutes) || schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES;
    const remainingMins = Math.round((remainingPct / 100) * estimatedMins);

    return {
      ...topic,
      prerequisites: prereqMap.get(topic.id) || [],
      remaining_percentage: remainingPct,
      remaining_work_minutes: remainingMins,
      is_completed: remainingPct <= 0
    };
  });

  // 5. Build Study Availability Schedule (with default fallback)
  let weeklyAvailability = availabilityRes.rows;
  if (weeklyAvailability.length === 0) {
    // If student has not set specific slots, use fallback default schedule
    weeklyAvailability = schedulerConfig.DEFAULT_AVAILABILITY;
  }

  // 6. Calculate Historical Capacity & Adherence via Phase 9 Pure Services
  const studyMetrics = calculateStudyMetrics(historicalSessionsRes.rows, lookbackDays, timezone);
  const plannerMetrics = calculatePlannerMetrics(historicalPlansRes.rows, historicalSessionsRes.rows, lookbackDays, timezone);

  const observedAvgSessionMinutes = studyMetrics.average_session_minutes > 0
    ? Math.round(studyMetrics.average_session_minutes)
    : schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES;

  const observedDailyAvgMinutes = studyMetrics.daily_average_minutes > 0
    ? Math.round(studyMetrics.daily_average_minutes)
    : 0;

  const userMaxDailyMinutes = profile.daily_available_hours
    ? Math.min(Math.round(profile.daily_available_hours * 60), schedulerConfig.SESSION_BOUNDS.HARD_DAILY_CEILING_MINUTES)
    : schedulerConfig.SESSION_BOUNDS.DEFAULT_MAX_DAILY_MINUTES;

  return {
    user_id: userId,
    timezone,
    today: todayStr,
    period: {
      start: periodStart,
      end: periodEnd
    },
    preferences: {
      daily_available_hours: profile.daily_available_hours || 3,
      max_daily_minutes: userMaxDailyMinutes,
      preferred_session_minutes: schedulerConfig.SESSION_BOUNDS.DEFAULT_SESSION_MINUTES,
      min_session_minutes: schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES,
      max_session_minutes: schedulerConfig.SESSION_BOUNDS.MAX_SESSION_MINUTES,
      break_minutes: schedulerConfig.SESSION_BOUNDS.BREAK_MINUTES,
      preferred_start_time: profile.preferred_study_start_time || '18:00',
      preferred_end_time: profile.preferred_study_end_time || '21:00'
    },
    availability: weeklyAvailability,
    blocked_periods: blockedRes.rows,
    subjects,
    topics,
    recommendations: recommendationsRes.rows,
    existing_plans: existingPlansRes.rows,
    backlog: backlogPlansRes.rows,
    historical_metrics: {
      lookback_days: lookbackDays,
      total_sessions: studyMetrics.total_sessions || 0,
      observed_avg_session_minutes: observedAvgSessionMinutes,
      observed_daily_avg_minutes: observedDailyAvgMinutes,
      consistency_percentage: studyMetrics.study_consistency_percentage || 0,
      plan_adherence_rate: plannerMetrics.overall_adherence_percentage || 0
    }
  };
}

export default {
  buildSchedulingContext
};
