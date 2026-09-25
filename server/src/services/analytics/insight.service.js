/**
 * insight.service.js
 *
 * Deterministic insight engine that evaluates structured analytics metrics against
 * educational heuristics to produce prioritized, deduplicated, and neutral student insights.
 */

/**
 * Priority rank mapping for insight categories.
 */
const CATEGORY_PRIORITY = {
  EXAM_URGENCY: 100,
  QUIZ_PERFORMANCE_ATTENTION: 95,
  TOPIC_PERFORMANCE: 85,
  QUIZ_PERFORMANCE_INFO: 80,
  PLAN_ADHERENCE: 75,
  STUDY_CONSISTENCY: 70,
  STUDY_PATTERN: 65,
  SUBJECT_BALANCE: 60,
  ACADEMIC_PROGRESS: 50
};

/**
 * Evaluates analytics metrics and produces up to 3 to 5 prioritized, deduplicated insights.
 *
 * @param {Object} params
 * @param {Object} [params.studyMetrics] - Generated from study-metrics.service.js
 * @param {Object} [params.plannerMetrics] - Generated from planner-metrics.service.js
 * @param {Object} [params.quizMetrics] - Generated from quiz-metrics.service.js
 * @param {Object} [params.completionMetrics] - Generated from completion-metrics.service.js
 * @param {Array<Object>} [params.topicPerformances] - Array of topic_performance rows
 * @param {Array<Object>} [params.subjects] - Array of subjects records
 * @param {Array<Object>} [params.studySessions] - Array of raw study_sessions records
 * @param {number} [params.maxInsights=5] - Maximum insights to return (default 5, min 3)
 * @param {string} [params.referenceDate] - Current date (YYYY-MM-DD)
 * @returns {Array<Object>} Ranked insights [{ type, severity, title, message, data }]
 */
export function generateInsights({
  studyMetrics = null,
  plannerMetrics = null,
  quizMetrics = null,
  completionMetrics = null,
  topicPerformances = [],
  subjects = [],
  studySessions = [],
  maxInsights = 5,
  referenceDate = null
}) {
  const candidateInsights = [];
  const todayStr = referenceDate || new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

  // -------------------------------------------------------------
  // Rule 1: Approaching Exam with Incomplete Syllabus (EXAM_URGENCY)
  // -------------------------------------------------------------
  if (completionMetrics?.subjects && Array.isArray(completionMetrics.subjects)) {
    const upcomingExams = completionMetrics.subjects
      .filter(s => s.is_exam_upcoming && s.days_until_exam !== null && s.days_until_exam <= 7 && s.remaining_estimated_minutes > 0)
      .sort((a, b) => a.days_until_exam - b.days_until_exam);

    if (upcomingExams.length > 0) {
      const topExam = upcomingExams[0];
      const days = topExam.days_until_exam;
      const daysText = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
      const remHours = (topExam.remaining_estimated_minutes / 60).toFixed(1);

      candidateInsights.push({
        type: 'EXAM_URGENCY',
        severity: days <= 3 ? 'ATTENTION' : 'NOTICE',
        priority: CATEGORY_PRIORITY.EXAM_URGENCY,
        title: `${topExam.subject_name} Exam Approaching`,
        message: `${topExam.subject_name} exam is ${daysText} and approximately ${remHours}h of estimated syllabus work remains.`,
        data: {
          subject_id: topExam.subject_id,
          subject_name: topExam.subject_name,
          days_until_exam: days,
          remaining_minutes: topExam.remaining_estimated_minutes,
          completion_percentage: topExam.completion_percentage
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 2 & 3: Quiz Mastery Trajectory (QUIZ_PERFORMANCE)
  // -------------------------------------------------------------
  if (quizMetrics && quizMetrics.available && quizMetrics.total_quizzes >= 2) {
    if (quizMetrics.trend === 'IMPROVING' && quizMetrics.difference >= 5) {
      candidateInsights.push({
        type: 'QUIZ_PERFORMANCE',
        severity: 'INFO',
        priority: CATEGORY_PRIORITY.QUIZ_PERFORMANCE_INFO,
        title: 'Quiz Performance Improved',
        message: `Your recent quiz average (${quizMetrics.recent_average_score}%) is ${quizMetrics.difference} points higher than earlier attempts (${quizMetrics.previous_average_score}%).`,
        data: {
          recent_average: quizMetrics.recent_average_score,
          previous_average: quizMetrics.previous_average_score,
          difference: quizMetrics.difference
        }
      });
    } else if (quizMetrics.trend === 'DECLINING' && quizMetrics.difference <= -5) {
      candidateInsights.push({
        type: 'QUIZ_PERFORMANCE',
        severity: 'ATTENTION',
        priority: CATEGORY_PRIORITY.QUIZ_PERFORMANCE_ATTENTION,
        title: 'Quiz Performance Needs Reinforcement',
        message: `Your recent quiz average (${quizMetrics.recent_average_score}%) dropped by ${Math.abs(quizMetrics.difference)} points compared to previous assessments (${quizMetrics.previous_average_score}%).`,
        data: {
          recent_average: quizMetrics.recent_average_score,
          previous_average: quizMetrics.previous_average_score,
          difference: quizMetrics.difference
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 4: Weak Topic Concentration in Subject (TOPIC_PERFORMANCE)
  // -------------------------------------------------------------
  if (Array.isArray(topicPerformances) && topicPerformances.length > 0) {
    const weakList = topicPerformances.filter(tp => {
      const lvl = (tp.performance_level || '').toUpperCase();
      const score = Number(tp.composite_score) || 0;
      return lvl === 'WEAK' || score < 50;
    });

    // Group weak topics by subject
    const subjectWeakMap = new Map();
    for (const w of weakList) {
      const subName = w.subject_name || w.subjects?.name || 'Academic Subject';
      if (!subjectWeakMap.has(subName)) {
        subjectWeakMap.set(subName, []);
      }
      subjectWeakMap.get(subName).push(w.topic_name || w.topics?.name || 'Topic');
    }

    // Identify subject with the highest concentration of weak topics (>= 2)
    let maxSub = null;
    let maxCount = 0;
    for (const [subName, list] of subjectWeakMap.entries()) {
      if (list.length >= 2 && list.length > maxCount) {
        maxCount = list.length;
        maxSub = { subject_name: subName, topics: list };
      }
    }

    if (maxSub) {
      candidateInsights.push({
        type: 'TOPIC_PERFORMANCE',
        severity: 'NOTICE',
        priority: CATEGORY_PRIORITY.TOPIC_PERFORMANCE,
        title: `Weak Topic Concentration in ${maxSub.subject_name}`,
        message: `${maxCount} topics currently classified as weak are in ${maxSub.subject_name}. The adaptive planner will prioritize these for upcoming sessions.`,
        data: {
          subject_name: maxSub.subject_name,
          weak_count: maxCount,
          weak_topics: maxSub.topics
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 5 & 6: Plan Adherence (PLAN_ADHERENCE)
  // -------------------------------------------------------------
  if (plannerMetrics && plannerMetrics.available && plannerMetrics.planned_minutes >= 60) {
    if (plannerMetrics.adherence_percentage >= 80) {
      candidateInsights.push({
        type: 'PLAN_ADHERENCE',
        severity: 'INFO',
        priority: CATEGORY_PRIORITY.PLAN_ADHERENCE,
        title: 'High Plan Adherence',
        message: `You completed ${plannerMetrics.adherence_percentage}% of your planned study duration (${plannerMetrics.actual_hours}h completed of ${plannerMetrics.planned_hours}h planned).`,
        data: {
          planned_minutes: plannerMetrics.planned_minutes,
          actual_minutes: plannerMetrics.actual_minutes,
          adherence_percentage: plannerMetrics.adherence_percentage
        }
      });
    } else if (plannerMetrics.adherence_percentage < 60) {
      candidateInsights.push({
        type: 'PLAN_ADHERENCE',
        severity: 'NOTICE',
        priority: CATEGORY_PRIORITY.PLAN_ADHERENCE,
        title: 'Study Time Below Planned Budget',
        message: `Completed study duration (${plannerMetrics.actual_hours}h) was below the amount planned (${plannerMetrics.planned_hours}h). Consider recalibrating your plan to match your available time.`,
        data: {
          planned_minutes: plannerMetrics.planned_minutes,
          actual_minutes: plannerMetrics.actual_minutes,
          adherence_percentage: plannerMetrics.adherence_percentage
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 7 & 8: Study Consistency (STUDY_CONSISTENCY)
  // -------------------------------------------------------------
  if (studyMetrics && studyMetrics.total_days >= 7) {
    if (studyMetrics.consistency_percentage >= 70) {
      candidateInsights.push({
        type: 'STUDY_CONSISTENCY',
        severity: 'INFO',
        priority: CATEGORY_PRIORITY.STUDY_CONSISTENCY,
        title: 'Consistent Study Routine',
        message: `You studied on ${studyMetrics.active_days} of the last ${studyMetrics.total_days} days (${studyMetrics.consistency_percentage}% consistency).`,
        data: {
          active_days: studyMetrics.active_days,
          total_days: studyMetrics.total_days,
          consistency_percentage: studyMetrics.consistency_percentage,
          current_streak: studyMetrics.current_streak
        }
      });
    } else if (studyMetrics.consistency_percentage < 35 && studyMetrics.session_count > 0) {
      candidateInsights.push({
        type: 'STUDY_CONSISTENCY',
        severity: 'NOTICE',
        priority: CATEGORY_PRIORITY.STUDY_CONSISTENCY,
        title: 'Study Routine Check-In',
        message: `You recorded study sessions on ${studyMetrics.active_days} of the last ${studyMetrics.total_days} days. Setting smaller daily study goals can help build consistency.`,
        data: {
          active_days: studyMetrics.active_days,
          total_days: studyMetrics.total_days,
          consistency_percentage: studyMetrics.consistency_percentage
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 9: Inactivity Gap (STUDY_PATTERN)
  // -------------------------------------------------------------
  if (studySessions && studySessions.length > 0) {
    // Find the latest completed study session
    const timestamps = studySessions
      .map(s => new Date(s.started_at || s.created_at).getTime())
      .filter(t => !isNaN(t));

    if (timestamps.length > 0) {
      const latestMs = Math.max(...timestamps);
      const daysSinceLast = Math.round((todayMs - latestMs) / (24 * 60 * 60 * 1000));

      if (daysSinceLast >= 5) {
        candidateInsights.push({
          type: 'STUDY_PATTERN',
          severity: 'NOTICE',
          priority: CATEGORY_PRIORITY.STUDY_PATTERN,
          title: 'Recent Inactivity Gap',
          message: `No study sessions have been recorded in the past ${daysSinceLast} days. Resuming with a short focus block will help restore momentum.`,
          data: {
            days_inactive: daysSinceLast
          }
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 10: Subject Distribution Concentration (SUBJECT_BALANCE)
  // -------------------------------------------------------------
  if (Array.isArray(studySessions) && studySessions.length > 0 && subjects.length >= 2) {
    const subMinsMap = new Map();
    let totalMins = 0;

    for (const s of studySessions) {
      const subId = s.subject_id;
      const mins = Number(s.duration_minutes) || 0;
      if (subId && mins > 0) {
        totalMins += mins;
        subMinsMap.set(subId, (subMinsMap.get(subId) || 0) + mins);
      }
    }

    if (totalMins >= 120) {
      for (const [subId, mins] of subMinsMap.entries()) {
        const pct = Math.round((mins / totalMins) * 100);
        if (pct >= 65) {
          const sub = subjects.find(item => item.id === subId);
          const subName = sub?.name || 'a single subject';
          candidateInsights.push({
            type: 'SUBJECT_BALANCE',
            severity: 'INFO',
            priority: CATEGORY_PRIORITY.SUBJECT_BALANCE,
            title: `Study Focus Concentrated on ${subName}`,
            message: `Most recent study time (${pct}%) has been allocated to ${subName}.`,
            data: {
              subject_id: subId,
              subject_name: subName,
              percentage: pct,
              minutes: mins
            }
          });
          break; // Only report the dominant subject
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 11: Curriculum Completion Milestone (ACADEMIC_PROGRESS)
  // -------------------------------------------------------------
  if (completionMetrics && completionMetrics.topics_count > 0 && completionMetrics.overall_completion_percentage === 100) {
    candidateInsights.push({
      type: 'ACADEMIC_PROGRESS',
      severity: 'INFO',
      priority: CATEGORY_PRIORITY.ACADEMIC_PROGRESS,
      title: 'Curriculum 100% Covered',
      message: 'All configured syllabus topics are marked as complete. Regular quiz practice is recommended to maintain active recall.',
      data: {
        overall_completion_percentage: 100,
        topics_count: completionMetrics.topics_count
      }
    });
  }

  // -------------------------------------------------------------
  // Deduplication & Prioritized Ranking (Capped at 3 to 5)
  // -------------------------------------------------------------
  // Sort candidate insights by priority descending
  candidateInsights.sort((a, b) => b.priority - a.priority);

  // Deduplicate by type (keep the highest priority insight per type)
  const seenTypes = new Set();
  const filteredInsights = [];

  for (const item of candidateInsights) {
    if (!seenTypes.has(item.type)) {
      seenTypes.add(item.type);
      // Remove internal priority field from final presentation payload
      const { priority, ...cleanItem } = item;
      filteredInsights.push(cleanItem);
    }
  }

  const limit = Math.max(3, Math.min(5, Number(maxInsights) || 5));
  return filteredInsights.slice(0, limit);
}
