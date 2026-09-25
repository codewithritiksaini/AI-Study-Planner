/**
 * recommendation-context.service.js
 *
 * Efficiently aggregates and structures all student analytics, performance records,
 * syllabus topics, upcoming exam deadlines, study sessions, and plan history
 * into a single unified RecommendationContext object.
 *
 * Adheres to:
 * - Single batch database roundtrip with zero N+1 queries
 * - Full reuse of Phase 9 pure metric calculation services
 * - Timezone-aware local date calculations
 */

import { query } from '../../config/db.js';
import {
  calculateStudyMetrics,
  calculatePlannerMetrics,
  calculateQuizMetrics,
  calculateCompletionMetrics,
  getLocalDateString
} from '../metrics/index.js';
import { recommendationConfig } from '../../config/recommendation.config.js';

/**
 * Calculates days difference between two YYYY-MM-DD date strings.
 */
function getDaysDiff(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return null;
  const fromTime = new Date(fromDateStr + 'T00:00:00Z').getTime();
  const toTime = new Date(toDateStr + 'T00:00:00Z').getTime();
  return Math.round((toTime - fromTime) / (24 * 60 * 60 * 1000));
}

/**
 * Builds the complete RecommendationContext for a given student user.
 *
 * @param {string} userId - UUID of the authenticated user
 * @param {Object} options - Optional lookback days and timezone overrides
 * @returns {Promise<Object>} Aggregated RecommendationContext
 */
export async function buildRecommendationContext(userId, options = {}) {
  const lookbackDays = Math.max(7, Math.min(90, Number(options.lookbackDays) || 30));

  // 1. Fetch user profile for timezone and study capacity
  const profileRes = await query(
    `SELECT id, full_name, email, branch, semester, target_cgpa, 
            daily_available_hours, timezone, created_at
     FROM public.profiles
     WHERE id = $1 LIMIT 1;`,
    [userId]
  );

  const profile = profileRes.rows[0] || {};
  const timezone = profile.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), timezone);
  const lookbackStartDateStr = new Date(
    new Date(todayStr + 'T00:00:00Z').getTime() - (lookbackDays - 1) * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];

  // 2. Concurrently fetch all raw entities in parallel (1 database roundtrip)
  const [
    subjectsRes,
    topicsRes,
    sessionsRes,
    plansRes,
    attemptsRes,
    perfRes
  ] = await Promise.all([
    // A. Student's subjects
    query(
      `SELECT id, name, color, exam_date, target_score
       FROM public.subjects
       WHERE user_id = $1
       ORDER BY name ASC;`,
      [userId]
    ),

    // B. Student's syllabus topics with subject join
    query(
      `SELECT t.id, t.subject_id, t.name, t.difficulty, t.estimated_minutes,
              t.status, t.completion_percentage,
              s.name AS subject_name, s.color AS subject_color, s.exam_date
       FROM public.topics t
       JOIN public.subjects s ON t.subject_id = s.id
       WHERE s.user_id = $1
       ORDER BY s.name ASC, t.created_at ASC;`,
      [userId]
    ),

    // C. Recent study sessions in lookback window
    query(
      `SELECT ss.id, ss.subject_id, ss.topic_id, ss.started_at, ss.ended_at,
              ss.duration_minutes, ss.status
       FROM public.study_sessions ss
       WHERE ss.user_id = $1 AND ss.started_at >= ($2::date)
       ORDER BY ss.started_at DESC;`,
      [userId, lookbackStartDateStr]
    ),

    // D. Study plans in lookback window and today
    query(
      `SELECT sp.id, sp.subject_id, sp.topic_id, sp.plan_date, sp.planned_minutes,
              sp.priority_score, sp.reason, sp.status, sp.source
       FROM public.study_plans sp
       WHERE sp.user_id = $1 AND sp.plan_date >= ($2::date)
       ORDER BY sp.plan_date DESC;`,
      [userId, lookbackStartDateStr]
    ),

    // E. Quiz attempts
    query(
      `SELECT qa.id, qa.quiz_id, qa.score, qa.max_score, qa.percentage, 
              qa.status, qa.submitted_at, q.topic_id, q.subject_id
       FROM public.quiz_attempts qa
       JOIN public.quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1 AND qa.status = 'COMPLETED'
       ORDER BY qa.submitted_at DESC;`,
      [userId]
    ),

    // F. Topic performance records
    query(
      `SELECT id, subject_id, topic_id, attempt_count, total_questions,
              correct_answers, average_percentage, recent_percentage,
              performance_level, confidence_score, last_attempted_at
       FROM public.topic_performance
       WHERE user_id = $1;`,
      [userId]
    )
  ]);

  const subjects = subjectsRes.rows;
  const topics = topicsRes.rows;
  const sessions = sessionsRes.rows;
  const plans = plansRes.rows;
  const attempts = attemptsRes.rows;
  const topicPerformance = perfRes.rows;

  // 3. Process exam deadlines and subject urgency
  const examUrgentSubjects = [];
  const processedSubjects = subjects.map((sub) => {
    let daysUntilExam = null;
    let urgency = 'NORMAL';
    let isPast = false;

    if (sub.exam_date) {
      const examDateStr = getLocalDateString(sub.exam_date, timezone);
      daysUntilExam = getDaysDiff(todayStr, examDateStr);

      if (daysUntilExam < 0) {
        isPast = true;
        urgency = 'EXPIRED';
      } else if (daysUntilExam === 0) {
        urgency = 'EXAM_TODAY';
      } else if (daysUntilExam <= recommendationConfig.EXAM_THRESHOLDS.SOON_DAYS) {
        urgency = 'EXAM_SOON';
      } else if (daysUntilExam <= recommendationConfig.EXAM_THRESHOLDS.APPROACHING_DAYS) {
        urgency = 'EXAM_APPROACHING';
      } else {
        urgency = 'NORMAL';
      }

      if (!isPast && daysUntilExam <= recommendationConfig.EXAM_THRESHOLDS.LOOKAHEAD_DAYS) {
        examUrgentSubjects.push({
          ...sub,
          daysUntilExam,
          urgency
        });
      }
    }

    return {
      ...sub,
      daysUntilExam,
      urgency,
      isPast
    };
  });

  // Sort examUrgentSubjects by nearest exam first
  examUrgentSubjects.sort((a, b) => a.daysUntilExam - b.daysUntilExam);

  // 4. Map topic performance
  const performanceMap = {};
  for (const perf of topicPerformance) {
    performanceMap[perf.topic_id] = {
      attempt_count: Number(perf.attempt_count) || 0,
      average_percentage: Number(perf.average_percentage) || 0,
      recent_percentage: Number(perf.recent_percentage) || 0,
      performance_level: perf.performance_level || 'AVERAGE',
      confidence_score: Number(perf.confidence_score) || 0,
      last_attempted_at: perf.last_attempted_at
    };
  }

  // 5. Aggregate study sessions per topic & subject
  const topicStudyStats = {};
  const subjectStudyStats = {};
  let totalStudyMinutes = 0;
  let totalSessionsCount = sessions.length;

  for (const s of sessions) {
    const mins = Number(s.duration_minutes) || 0;
    totalStudyMinutes += mins;

    // Per subject
    if (s.subject_id) {
      if (!subjectStudyStats[s.subject_id]) {
        subjectStudyStats[s.subject_id] = { totalMinutes: 0, sessionCount: 0 };
      }
      subjectStudyStats[s.subject_id].totalMinutes += mins;
      subjectStudyStats[s.subject_id].sessionCount += 1;
    }

    // Per topic
    if (s.topic_id) {
      if (!topicStudyStats[s.topic_id]) {
        topicStudyStats[s.topic_id] = {
          totalMinutes: 0,
          sessionCount: 0,
          lastStudiedAt: null,
          daysSinceLastStudy: null
        };
      }
      topicStudyStats[s.topic_id].totalMinutes += mins;
      topicStudyStats[s.topic_id].sessionCount += 1;

      const sessionDateStr = getLocalDateString(s.started_at, timezone);
      if (!topicStudyStats[s.topic_id].lastStudiedAt || s.started_at > topicStudyStats[s.topic_id].lastStudiedAt) {
        topicStudyStats[s.topic_id].lastStudiedAt = s.started_at;
        topicStudyStats[s.topic_id].daysSinceLastStudy = getDaysDiff(sessionDateStr, todayStr);
      }
    }
  }

  // Calculate subject study share percentages
  for (const subId of Object.keys(subjectStudyStats)) {
    subjectStudyStats[subId].shareOfTotal = totalStudyMinutes > 0
      ? Number((subjectStudyStats[subId].totalMinutes / totalStudyMinutes).toFixed(2))
      : 0;
  }

  // 6. Calculate realistic average session duration for capacity sizing
  let averageSessionMinutes = 45; // Default sensible baseline
  if (totalSessionsCount > 0 && totalStudyMinutes > 0) {
    const rawAvg = Math.round(totalStudyMinutes / totalSessionsCount);
    // Clamp to realistic bounds [20, 60] minutes
    averageSessionMinutes = Math.max(20, Math.min(60, rawAvg));
  }

  // 7. Process topics with clean completion percentage & stats
  const processedTopics = topics.map((t) => {
    const rawCompletion = Number(t.completion_percentage);
    const completionPercentage = !isNaN(rawCompletion)
      ? Math.max(0, Math.min(100, Math.round(rawCompletion)))
      : (t.status === 'COMPLETED' ? 100 : 0);

    const studyStats = topicStudyStats[t.id] || {
      totalMinutes: 0,
      sessionCount: 0,
      lastStudiedAt: null,
      daysSinceLastStudy: null
    };

    const perf = performanceMap[t.id] || null;

    return {
      ...t,
      completion_percentage: completionPercentage,
      is_completed: t.status === 'COMPLETED' || completionPercentage >= 100,
      study_minutes_recorded: studyStats.totalMinutes,
      study_sessions_count: studyStats.sessionCount,
      last_studied_at: studyStats.lastStudiedAt,
      days_since_last_study: studyStats.daysSinceLastStudy,
      performance: perf
    };
  });

  // 8. Identify backlog tasks (missed or uncompleted past plans)
  const backlogTasks = plans.filter((p) => {
    const planDateStr = getLocalDateString(p.plan_date, timezone);
    const isPastPlan = planDateStr < todayStr;
    return (p.status === 'MISSED' || (p.status === 'PENDING' && isPastPlan));
  });

  // 9. Reusable Phase 9 statistical calculations
  const studyMetrics = calculateStudyMetrics(sessions, lookbackDays, timezone);
  const plannerMetrics = calculatePlannerMetrics(plans, sessions, lookbackDays, timezone);
  const quizMetrics = calculateQuizMetrics(attempts, timezone);
  const completionMetrics = calculateCompletionMetrics(topics, subjects, timezone);

  return {
    userId,
    todayStr,
    timezone,
    profile,
    averageSessionMinutes,
    subjects: processedSubjects,
    topics: processedTopics,
    examUrgentSubjects,
    performanceMap,
    topicStudyStats,
    subjectStudyStats,
    backlogTasks,
    metrics: {
      study: studyMetrics,
      planner: plannerMetrics,
      quiz: quizMetrics,
      completion: completionMetrics
    }
  };
}

export default buildRecommendationContext;
