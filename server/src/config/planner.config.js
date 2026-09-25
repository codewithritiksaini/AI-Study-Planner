/**
 * Planner Configuration & Engineering Constants
 * Centralized weights, duration bounds, break rules, and priority labels.
 */
export const PLANNER_CONFIG = {
  // Multi-factor priority weights (sum = 1.0)
  weights: {
    examUrgency: 0.40,
    completionNeed: 0.30,
    difficulty: 0.15,
    inactivity: 0.15
  },

  // Scheduling block constraints (in minutes)
  scheduling: {
    defaultTopicDurationMinutes: 45,
    minStudyBlockMinutes: 25,
    maxStudyBlockMinutes: 90,
    breakIntervalMinutes: 50,  // Insert break after continuous blocks >= 50m
    breakDurationMinutes: 10,  // Standard rest duration
    defaultDailyAvailableHours: 2, // Fallback if profile does not specify
    defaultStudyStartTime: '18:00', // Default study window start
    defaultStudyEndTime: '22:00'    // Default study window end
  },

  // Normalized difficulty factor mapping
  difficultyWeights: {
    EASY: 0.33,
    MEDIUM: 0.66,
    HARD: 1.00
  },

  // Priority display category thresholds (0.0 to 1.0 scale)
  priorityLabels: {
    HIGH: 0.70,
    MEDIUM: 0.40
  },

  // Study plans status enums
  statuses: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    MISSED: 'MISSED',
    SKIPPED: 'SKIPPED'
  },

  // Valid status transitions
  validStatusTransitions: {
    PENDING: ['IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'MISSED'],
    IN_PROGRESS: ['COMPLETED', 'SKIPPED'],
    COMPLETED: [],
    MISSED: ['PENDING'],
    SKIPPED: ['PENDING']
  },

  // Source identifier
  source: 'RULE_ENGINE'
};
