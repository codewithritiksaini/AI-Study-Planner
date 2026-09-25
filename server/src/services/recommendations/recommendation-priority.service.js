/**
 * recommendation-priority.service.js
 *
 * Deterministic scoring, capacity-aware duration sizing, deduplication,
 * and diversity filtering engine for Phase 10.
 *
 * Scoring Formula:
 * priority_score = exam_factor (0-40)
 *                + weakness_factor (0-25)
 *                + incompletion_factor (0-20)
 *                + backlog_factor (0-10)
 *                + recency_factor (0-5)
 * Total Score Range: 0.00 - 100.00
 *
 * Priority Tiers:
 * HIGH: score >= 65.0
 * MEDIUM: 40.0 <= score < 65.0
 * LOW: score < 40.0
 */

import { recommendationConfig } from '../../config/recommendation.config.js';

/**
 * 1. Computes the Exam Urgency Factor (0 - 40 points)
 */
export function calculateExamFactor(daysUntilExam) {
  if (daysUntilExam === null || daysUntilExam === undefined || daysUntilExam < 0) {
    return 0;
  }
  if (daysUntilExam === 0) return 40; // Exam today
  if (daysUntilExam <= 3) return 35; // Exam soon (1-3 days)
  if (daysUntilExam <= 7) return 25; // Exam approaching (4-7 days)
  if (daysUntilExam <= 14) return 15;// Within 2 weeks
  if (daysUntilExam <= 30) return 8; // Within 1 month
  return 2;
}

/**
 * 2. Computes the Weakness Factor (0 - 25 points)
 */
export function calculateWeaknessFactor(performance) {
  if (!performance || performance.attempt_count === 0) {
    return 5; // Unassessed baseline
  }
  const avg = Number(performance.average_percentage) || 0;
  if (avg <= 40) return 25; // Critical weakness
  if (avg <= 50) return 20;
  if (avg < 60) return 15;  // Moderate weakness
  if (avg < 75) return 8;   // Needs practice
  if (avg < 85) return 3;   // Average
  return 0;                 // Strong mastery
}

/**
 * 3. Computes the Incompletion Factor (0 - 20 points)
 */
export function calculateIncompletionFactor(completionPercentage, isCompleted) {
  if (isCompleted || completionPercentage >= 100) {
    return 0;
  }
  const comp = Math.max(0, Math.min(99, Number(completionPercentage) || 0));
  const remainingWork = 100 - comp;
  // Scaled linearly from 0 to 20
  return Number(((remainingWork / 100) * 20).toFixed(2));
}

/**
 * 4. Computes the Backlog Factor (0 - 10 points)
 */
export function calculateBacklogFactor(backlogCount) {
  const count = Number(backlogCount) || 0;
  if (count >= 5) return 10;
  if (count >= 3) return 7;
  if (count >= 1) return 3;
  return 0;
}

/**
 * 5. Computes the Recency Factor (0 - 5 points)
 */
export function calculateRecencyFactor(daysSinceLastStudy) {
  if (daysSinceLastStudy === null || daysSinceLastStudy === undefined) {
    return 2; // Never studied
  }
  const days = Number(daysSinceLastStudy) || 0;
  if (days >= 28) return 5; // 4+ weeks of decay
  if (days >= 14) return 3; // 2-3 weeks of decay
  if (days >= 7) return 1;
  return 0;
}

/**
 * Calculates composite priority score and assigns priority tier.
 */
export function evaluateCandidatePriority(candidate, context) {
  const subject = candidate.subject_id
    ? context.subjects.find((s) => s.id === candidate.subject_id)
    : null;
  const topic = candidate.topic_id
    ? context.topics.find((t) => t.id === candidate.topic_id)
    : null;

  const daysUntilExam = subject ? subject.daysUntilExam : null;
  const performance = topic ? topic.performance : null;
  const completionPercentage = topic ? topic.completion_percentage : 0;
  const isCompleted = topic ? topic.is_completed : false;
  const backlogCount = context.backlogTasks ? context.backlogTasks.length : 0;
  const daysSinceStudy = topic ? topic.days_since_last_study : null;

  // Specific candidate rule adjustments
  let examFactor = calculateExamFactor(daysUntilExam);
  let weaknessFactor = calculateWeaknessFactor(performance);
  let incompletionFactor = calculateIncompletionFactor(completionPercentage, isCompleted);
  let backlogFactor = calculateBacklogFactor(backlogCount);
  let recencyFactor = calculateRecencyFactor(daysSinceStudy);

  // Type-specific emphasis adjustments
  if (candidate.type === recommendationConfig.TYPES.EXAM_PREPARATION) {
    examFactor = Math.max(examFactor, 30);
  } else if (candidate.type === recommendationConfig.TYPES.WEAK_TOPIC) {
    weaknessFactor = Math.max(weaknessFactor, 20);
  } else if (candidate.type === recommendationConfig.TYPES.BACKLOG) {
    backlogFactor = Math.min(10, Math.max(8, backlogCount * 2));
  } else if (candidate.type === recommendationConfig.TYPES.REVISION) {
    recencyFactor = Math.max(recencyFactor, 4);
  }

  const rawScore = examFactor + weaknessFactor + incompletionFactor + backlogFactor + recencyFactor;
  const priorityScore = Number(Math.max(0, Math.min(100, rawScore)).toFixed(2));

  // Determine priority tier
  let priority = recommendationConfig.PRIORITY.LOW;
  if (priorityScore >= recommendationConfig.PRIORITY_SCORE_THRESHOLDS.HIGH) {
    priority = recommendationConfig.PRIORITY.HIGH;
  } else if (priorityScore >= recommendationConfig.PRIORITY_SCORE_THRESHOLDS.MEDIUM) {
    priority = recommendationConfig.PRIORITY.MEDIUM;
  }

  // Calculate capacity-aware duration sizing
  const boundedDuration = calculateRealisticDuration(candidate, context);

  return {
    ...candidate,
    priority_score: priorityScore,
    priority,
    estimated_minutes: boundedDuration,
    score_breakdown: {
      exam_factor: examFactor,
      weakness_factor: weaknessFactor,
      incompletion_factor: incompletionFactor,
      backlog_factor: backlogFactor,
      recency_factor: recencyFactor,
      total_score: priorityScore
    }
  };
}

/**
 * Capacity-Aware Sizing:
 * Determines realistic session duration based on user's average session length
 * and candidate requirements (bounded strictly between 10m and 90m).
 */
export function calculateRealisticDuration(candidate, context) {
  const { DURATION_BOUNDS } = recommendationConfig;
  const userAvg = context.averageSessionMinutes || DURATION_BOUNDS.DEFAULT_MINUTES;

  let baseDuration = userAvg;

  if (candidate.type === recommendationConfig.TYPES.QUIZ_PRACTICE) {
    baseDuration = 20; // Focused quiz block
  } else if (candidate.type === recommendationConfig.TYPES.REVISION) {
    baseDuration = 25; // Quick retention review
  } else if (candidate.type === recommendationConfig.TYPES.BACKLOG) {
    baseDuration = 30; // Planner reorganization
  } else if (candidate.type === recommendationConfig.TYPES.WEAK_TOPIC) {
    baseDuration = Math.min(45, userAvg);
  } else if (candidate.type === recommendationConfig.TYPES.UNFINISHED_TOPIC) {
    const topic = candidate.topic_id
      ? context.topics.find((t) => t.id === candidate.topic_id)
      : null;
    if (topic) {
      const remaining = Math.round(((100 - (topic.completion_percentage || 0)) / 100) * (topic.estimated_minutes || 60));
      baseDuration = Math.min(remaining, userAvg);
    }
  }

  // Enforce strict upper and lower limits
  return Math.max(DURATION_BOUNDS.MIN_MINUTES, Math.min(DURATION_BOUNDS.MAX_MINUTES, baseDuration));
}

/**
 * Deduplicates and merges overlapping topic recommendations.
 * e.g., If topic T is flagged as WEAK_TOPIC and UNFINISHED_TOPIC,
 * combine into highest priority recommendation without duplicate cards.
 */
export function deduplicateCandidates(candidates) {
  const topicMap = new Map();
  const nonTopicCandidates = [];

  for (const c of candidates) {
    if (!c.topic_id) {
      nonTopicCandidates.push(c);
      continue;
    }

    if (!topicMap.has(c.topic_id)) {
      topicMap.set(c.topic_id, c);
    } else {
      // Overlapping candidate for same topic: merge with higher priority
      const existing = topicMap.get(c.topic_id);
      if (c.priority_score > existing.priority_score) {
        // Upgrade existing with higher priority candidate but preserve joint context
        topicMap.set(c.topic_id, {
          ...c,
          reason: {
            ...existing.reason,
            ...c.reason
          }
        });
      } else {
        existing.reason = {
          ...c.reason,
          ...existing.reason
        };
      }
    }
  }

  return [...nonTopicCandidates, ...Array.from(topicMap.values())];
}

/**
 * Applies Diversity Filtering and Top-N selection.
 * Limits the number of recommendations of the same type to MAX_PER_TYPE (default 2)
 * so students get a well-rounded set of actions across exams, weak topics, and practice.
 *
 * @param {Array<Object>} candidates - Scored and deduplicated candidates
 * @param {number} limit - Maximum recommendations to return (default 5)
 * @returns {Array<Object>} Final ranked and diversified recommendations
 */
export function applyDiversityFilter(candidates, limit = recommendationConfig.LIMITS.DEFAULT_CANDIDATE_LIMIT) {
  // Sort descending by priority_score
  const sorted = [...candidates].sort((a, b) => b.priority_score - a.priority_score);

  const { MAX_PER_TYPE } = recommendationConfig.LIMITS;
  const typeCounts = {};
  const selected = [];
  const deferred = [];

  // 1st Pass: Pick highest score while respecting MAX_PER_TYPE
  for (const c of sorted) {
    const currentCount = typeCounts[c.type] || 0;
    if (currentCount < MAX_PER_TYPE) {
      selected.push(c);
      typeCounts[c.type] = currentCount + 1;
      if (selected.length >= limit) {
        return selected;
      }
    } else {
      deferred.push(c);
    }
  }

  // 2nd Pass: If selected count is still below limit, fill from deferred
  for (const c of deferred) {
    if (selected.length >= limit) break;
    selected.push(c);
  }

  return selected;
}

/**
 * End-to-end recommendation ranking pipeline:
 * Candidates -> Priority Evaluation -> Deduplication -> Diversity Filter -> Top N
 *
 * @param {Array<Object>} rawCandidates - Output from generateRecommendationCandidates
 * @param {Object} context - Output from buildRecommendationContext
 * @param {number} [limit] - Maximum recommendations (default 5)
 * @returns {Array<Object>} Final prioritized recommendations
 */
export function rankAndFilterRecommendations(
  rawCandidates = [],
  context = {},
  limit = recommendationConfig.LIMITS.DEFAULT_CANDIDATE_LIMIT
) {
  if (!rawCandidates || rawCandidates.length === 0) {
    return [];
  }

  // 1. Calculate deterministic priority score & realistic duration for each candidate
  const scored = rawCandidates.map((c) => evaluateCandidatePriority(c, context));

  // 2. Deduplicate overlapping recommendations targeting the same topic
  const deduplicated = deduplicateCandidates(scored);

  // 3. Apply diversity filter and limit
  const finalRecommendations = applyDiversityFilter(deduplicated, limit);

  return finalRecommendations;
}

export default {
  calculateExamFactor,
  calculateWeaknessFactor,
  calculateIncompletionFactor,
  calculateBacklogFactor,
  calculateRecencyFactor,
  evaluateCandidatePriority,
  calculateRealisticDuration,
  deduplicateCandidates,
  applyDiversityFilter,
  rankAndFilterRecommendations
};
