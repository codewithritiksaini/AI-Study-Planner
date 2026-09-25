/**
 * recommendation-rules.service.js
 *
 * Deterministic candidate generation rules for Phase 10.
 * Evaluates the aggregated RecommendationContext against independent, isolated rule functions
 * to produce actionable recommendation candidates.
 *
 * All recommendations are grounded in verified student metrics:
 * - Weak topics (quiz accuracy < 60% with attempts)
 * - Unfinished syllabus topics
 * - Upcoming exam preparation
 * - Retention revision (topics not studied in 14+ days)
 * - Diagnostic & post-study quiz practice
 * - Planner backlog alerts
 * - Subject study workload balancing
 */

import { recommendationConfig } from '../../config/recommendation.config.js';

/**
 * 1. Weak Topic Rule
 * Generates WEAK_TOPIC recommendations for topics where quiz performance is below threshold.
 */
export function getWeakTopicCandidates(context) {
  const candidates = [];
  const { WEAK_TOPIC_CONFIG, TYPES } = recommendationConfig;

  for (const topic of context.topics) {
    const perf = topic.performance;
    if (
      perf &&
      perf.attempt_count >= WEAK_TOPIC_CONFIG.MIN_REQUIRED_ATTEMPTS &&
      perf.average_percentage < WEAK_TOPIC_CONFIG.ACCURACY_THRESHOLD
    ) {
      // Find subject for exam urgency context
      const subject = context.subjects.find((s) => s.id === topic.subject_id);
      const daysUntilExam = subject ? subject.daysUntilExam : null;

      candidates.push({
        type: TYPES.WEAK_TOPIC,
        title: `Review ${topic.name}`,
        message: `Your recent quiz average for this topic is ${perf.average_percentage}%, which is below the target threshold. A targeted review will reinforce core concepts.`,
        subject_id: topic.subject_id,
        subject_name: topic.subject_name,
        topic_id: topic.id,
        topic_name: topic.name,
        estimated_minutes: Math.min(45, context.averageSessionMinutes || 35),
        reason: {
          topic_id: topic.id,
          topic_name: topic.name,
          quiz_average: perf.average_percentage,
          recent_percentage: perf.recent_percentage,
          attempt_count: perf.attempt_count,
          completion_percentage: topic.completion_percentage,
          days_until_exam: daysUntilExam
        },
        action: {
          type: 'START_QUIZ',
          target_id: topic.id,
          subject_id: topic.subject_id,
          path: `/quiz?subjectId=${topic.subject_id}&topicId=${topic.id}`
        },
        rule_metadata: {
          rule_name: 'WEAK_TOPIC_DETECTOR',
          weakness_score: Math.max(0, 100 - perf.average_percentage),
          days_until_exam: daysUntilExam
        }
      });
    }
  }

  return candidates;
}

/**
 * 2. Unfinished Topic Rule
 * Generates UNFINISHED_TOPIC recommendations for partially completed topics.
 */
export function getUnfinishedTopicCandidates(context) {
  const candidates = [];
  const { UNFINISHED_TOPIC_CONFIG, TYPES } = recommendationConfig;

  for (const topic of context.topics) {
    if (
      !topic.is_completed &&
      topic.completion_percentage >= UNFINISHED_TOPIC_CONFIG.MIN_COMPLETION_PERCENTAGE &&
      topic.completion_percentage <= UNFINISHED_TOPIC_CONFIG.MAX_COMPLETION_PERCENTAGE
    ) {
      const subject = context.subjects.find((s) => s.id === topic.subject_id);
      const daysUntilExam = subject ? subject.daysUntilExam : null;
      const remainingMinutes = Math.max(
        15,
        Math.round(((100 - topic.completion_percentage) / 100) * (topic.estimated_minutes || 60))
      );

      candidates.push({
        type: TYPES.UNFINISHED_TOPIC,
        title: `Continue ${topic.name}`,
        message: `This topic is ${topic.completion_percentage}% completed with approximately ${remainingMinutes} minutes of syllabus work remaining.`,
        subject_id: topic.subject_id,
        subject_name: topic.subject_name,
        topic_id: topic.id,
        topic_name: topic.name,
        estimated_minutes: Math.min(
          recommendationConfig.DURATION_BOUNDS.MAX_MINUTES,
          Math.max(recommendationConfig.DURATION_BOUNDS.MIN_MINUTES, Math.min(remainingMinutes, context.averageSessionMinutes || 45))
        ),
        reason: {
          topic_id: topic.id,
          topic_name: topic.name,
          completion_percentage: topic.completion_percentage,
          remaining_work_percentage: 100 - topic.completion_percentage,
          estimated_minutes_remaining: remainingMinutes,
          days_until_exam: daysUntilExam
        },
        action: {
          type: 'START_TOPIC',
          target_id: topic.id,
          subject_id: topic.subject_id,
          path: `/study?subjectId=${topic.subject_id}&topicId=${topic.id}`
        },
        rule_metadata: {
          rule_name: 'UNFINISHED_TOPIC_TRACKER',
          incompletion_score: 100 - topic.completion_percentage,
          days_until_exam: daysUntilExam
        }
      });
    }
  }

  return candidates;
}

/**
 * 3. Exam Preparation Rule
 * Generates EXAM_PREPARATION recommendations for subjects with exams approaching in <= 7 days.
 */
export function getExamPreparationCandidates(context) {
  const candidates = [];
  const { EXAM_THRESHOLDS, TYPES } = recommendationConfig;

  for (const subject of context.examUrgentSubjects) {
    if (subject.daysUntilExam >= 0 && subject.daysUntilExam <= EXAM_THRESHOLDS.APPROACHING_DAYS) {
      // Find incomplete topics for this subject
      const subjectTopics = context.topics.filter((t) => t.subject_id === subject.id);
      const incompleteTopics = subjectTopics.filter((t) => !t.is_completed);
      const weakTopics = subjectTopics.filter(
        (t) => t.performance && t.performance.average_percentage < recommendationConfig.WEAK_TOPIC_CONFIG.ACCURACY_THRESHOLD
      );

      // Only recommend if there is incomplete or weak work remaining
      if (incompleteTopics.length > 0 || weakTopics.length > 0) {
        const primaryTargetTopic = weakTopics[0] || incompleteTopics[0] || subjectTopics[0];

        candidates.push({
          type: TYPES.EXAM_PREPARATION,
          title: `Prepare for ${subject.name} Exam`,
          message: `Your ${subject.name} exam is ${subject.daysUntilExam === 0 ? 'today' : `in ${subject.daysUntilExam} day${subject.daysUntilExam === 1 ? '' : 's'}`}. ${incompleteTopics.length} topic${incompleteTopics.length === 1 ? '' : 's'} remain incomplete.`,
          subject_id: subject.id,
          subject_name: subject.name,
          topic_id: primaryTargetTopic ? primaryTargetTopic.id : null,
          topic_name: primaryTargetTopic ? primaryTargetTopic.name : null,
          estimated_minutes: Math.min(60, Math.max(30, context.averageSessionMinutes || 45)),
          reason: {
            subject_id: subject.id,
            subject_name: subject.name,
            days_until_exam: subject.daysUntilExam,
            urgency: subject.urgency,
            exam_date: subject.exam_date,
            incomplete_topics_count: incompleteTopics.length,
            weak_topics_count: weakTopics.length
          },
          action: {
            type: 'OPEN_SUBJECT',
            target_id: subject.id,
            subject_id: subject.id,
            path: `/subjects/${subject.id}`
          },
          rule_metadata: {
            rule_name: 'EXAM_PREPARATION_ACCELERATOR',
            days_until_exam: subject.daysUntilExam,
            urgency: subject.urgency
          }
        });
      }
    }
  }

  return candidates;
}

/**
 * 4. Revision Rule
 * Generates REVISION recommendations for completed topics not studied in >= 14 days.
 */
export function getRevisionCandidates(context) {
  const candidates = [];
  const { REVISION_CONFIG, TYPES } = recommendationConfig;

  for (const topic of context.topics) {
    if (topic.is_completed) {
      const daysSince = topic.days_since_last_study;
      // If studied >= 14 days ago or completed with no recent session
      if (daysSince !== null && daysSince >= REVISION_CONFIG.REVISION_AFTER_DAYS) {
        const subject = context.subjects.find((s) => s.id === topic.subject_id);

        candidates.push({
          type: TYPES.REVISION,
          title: `Revise ${topic.name}`,
          message: `This topic was completed earlier but has not been reviewed in ${daysSince} days. A quick retention review prevents decay.`,
          subject_id: topic.subject_id,
          subject_name: topic.subject_name,
          topic_id: topic.id,
          topic_name: topic.name,
          estimated_minutes: 25,
          reason: {
            topic_id: topic.id,
            topic_name: topic.name,
            days_since_last_study: daysSince,
            completion_percentage: 100
          },
          action: {
            type: 'REVIEW_TOPIC',
            target_id: topic.id,
            subject_id: topic.subject_id,
            path: `/study?subjectId=${topic.subject_id}&topicId=${topic.id}`
          },
          rule_metadata: {
            rule_name: 'RETENTION_REVISION_MONITOR',
            days_since_last_study: daysSince
          }
        });
      }
    }
  }

  return candidates;
}

/**
 * 5. Quiz Practice Rule
 * Generates QUIZ_PRACTICE recommendations for topics with study exposure but 0 quiz attempts.
 */
export function getQuizPracticeCandidates(context) {
  const candidates = [];
  const { QUIZ_PRACTICE_CONFIG, TYPES } = recommendationConfig;

  for (const topic of context.topics) {
    const studyMins = topic.study_minutes_recorded || 0;
    const perf = topic.performance;
    const attemptCount = perf ? perf.attempt_count : 0;

    // Has studied topic for >= 20 mins or topic is in progress, but no quiz attempts
    if (
      attemptCount <= QUIZ_PRACTICE_CONFIG.MAX_QUIZ_ATTEMPTS &&
      (studyMins >= QUIZ_PRACTICE_CONFIG.MIN_STUDY_EXPOSURE_MINUTES || topic.completion_percentage >= 50)
    ) {
      candidates.push({
        type: TYPES.QUIZ_PRACTICE,
        title: `Practice Quiz: ${topic.name}`,
        message: `You have studied ${topic.name} (${studyMins > 0 ? `${studyMins} minutes recorded` : `${topic.completion_percentage}% covered`}) but have not completed a practice quiz. Test your understanding!`,
        subject_id: topic.subject_id,
        subject_name: topic.subject_name,
        topic_id: topic.id,
        topic_name: topic.name,
        estimated_minutes: 20,
        reason: {
          topic_id: topic.id,
          topic_name: topic.name,
          study_minutes_recorded: studyMins,
          quiz_attempts: 0,
          completion_percentage: topic.completion_percentage
        },
        action: {
          type: 'START_QUIZ',
          target_id: topic.id,
          subject_id: topic.subject_id,
          path: `/quiz?subjectId=${topic.subject_id}&topicId=${topic.id}`
        },
        rule_metadata: {
          rule_name: 'QUIZ_DIAGNOSTIC_TRIGGER',
          study_minutes_recorded: studyMins
        }
      });
    }
  }

  return candidates;
}

/**
 * 6. Backlog Rule
 * Generates BACKLOG recommendation when missed/pending planned tasks accumulate (>= 3).
 */
export function getBacklogCandidates(context) {
  const candidates = [];
  const { BACKLOG_CONFIG, TYPES } = recommendationConfig;
  const count = context.backlogTasks.length;

  if (count >= BACKLOG_CONFIG.MIN_PENDING_MISSED_TASKS) {
    const missedCount = context.backlogTasks.filter((t) => t.status === 'MISSED').length;
    const pendingCount = context.backlogTasks.filter((t) => t.status === 'PENDING').length;

    candidates.push({
      type: TYPES.BACKLOG,
      title: 'Clear Study Task Backlog',
      message: `You have ${count} incomplete or missed study tasks. Reorganizing your timetable will keep your study schedule on track.`,
      subject_id: null,
      subject_name: null,
      topic_id: null,
      topic_name: null,
      estimated_minutes: 30,
      reason: {
        backlog_count: count,
        missed_count: missedCount,
        pending_count: pendingCount,
        plan_adherence_percentage: context.metrics.planner?.adherence_percentage || 0
      },
      action: {
        type: 'OPEN_PLANNER',
        target_id: null,
        subject_id: null,
        path: '/planner'
      },
      rule_metadata: {
        rule_name: 'BACKLOG_ACCUMULATION_GUARD',
        backlog_count: count
      }
    });
  }

  return candidates;
}

/**
 * 7. Study Balance Rule
 * Generates STUDY_BALANCE recommendations when one subject dominates study time (> 70%)
 * while other enrolled subjects have upcoming exams or low syllabus progress.
 */
export function getStudyBalanceCandidates(context) {
  const candidates = [];
  const { STUDY_BALANCE_CONFIG, TYPES } = recommendationConfig;

  let totalMinutes = 0;
  for (const s of Object.values(context.subjectStudyStats)) {
    totalMinutes += s.totalMinutes || 0;
  }

  if (totalMinutes >= STUDY_BALANCE_CONFIG.MIN_TOTAL_STUDY_MINUTES && context.subjects.length > 1) {
    for (const [subId, stat] of Object.entries(context.subjectStudyStats)) {
      if (stat.shareOfTotal > STUDY_BALANCE_CONFIG.MAX_SUBJECT_SHARE) {
        const dominantSubject = context.subjects.find((s) => s.id === subId);
        // Find other subjects that need attention
        const otherSubjects = context.subjects.filter((s) => s.id !== subId && !s.isPast);

        for (const other of otherSubjects) {
          const otherStats = context.subjectStudyStats[other.id] || { totalMinutes: 0 };
          const otherShare = totalMinutes > 0 ? (otherStats.totalMinutes / totalMinutes) : 0;

          if (otherShare < 0.15 || (other.daysUntilExam !== null && other.daysUntilExam <= 14)) {
            candidates.push({
              type: TYPES.STUDY_BALANCE,
              title: `Balance Study Focus: ${other.name}`,
              message: `${dominantSubject ? dominantSubject.name : 'One subject'} has received ${Math.round(stat.shareOfTotal * 100)}% of your study time. Allocating time to ${other.name} ensures well-rounded semester preparation.`,
              subject_id: other.id,
              subject_name: other.name,
              topic_id: null,
              topic_name: null,
              estimated_minutes: Math.min(45, context.averageSessionMinutes || 35),
              reason: {
                dominant_subject_name: dominantSubject ? dominantSubject.name : 'Dominant Subject',
                dominant_share_percentage: Math.round(stat.shareOfTotal * 100),
                neglected_subject_name: other.name,
                neglected_share_percentage: Math.round(otherShare * 100),
                days_until_exam: other.daysUntilExam
              },
              action: {
                type: 'OPEN_SUBJECT',
                target_id: other.id,
                subject_id: other.id,
                path: `/subjects/${other.id}`
              },
              rule_metadata: {
                rule_name: 'STUDY_BALANCE_MONITOR',
                imbalance_ratio: stat.shareOfTotal
              }
            });
            break; // One balance candidate is sufficient
          }
        }
      }
    }
  }

  return candidates;
}

/**
 * Aggregates all recommendation rule candidates from context.
 *
 * @param {Object} context - Output from buildRecommendationContext
 * @returns {Array<Object>} Combined candidate list
 */
export function generateRecommendationCandidates(context) {
  if (!context) return [];

  const candidates = [
    ...getWeakTopicCandidates(context),
    ...getExamPreparationCandidates(context),
    ...getUnfinishedTopicCandidates(context),
    ...getRevisionCandidates(context),
    ...getQuizPracticeCandidates(context),
    ...getBacklogCandidates(context),
    ...getStudyBalanceCandidates(context)
  ];

  return candidates;
}

export default {
  getWeakTopicCandidates,
  getUnfinishedTopicCandidates,
  getExamPreparationCandidates,
  getRevisionCandidates,
  getQuizPracticeCandidates,
  getBacklogCandidates,
  getStudyBalanceCandidates,
  generateRecommendationCandidates
};
