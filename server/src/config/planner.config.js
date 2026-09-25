/**
 * Planner Configuration & Engineering Constants
 * Centralized weights, duration bounds, break rules, and priority labels.
 * Extended in Phase 8 for the Adaptive Study Planner.
 */
export const PLANNER_CONFIG = {
  // Legacy / Phase 5 multi-factor priority weights (sum = 1.0)
  weights: {
    examUrgency: 0.40,
    completionNeed: 0.30,
    difficulty: 0.15,
    inactivity: 0.15
  },

  // Phase 8 Adaptive Priority Weights (sum = 1.0)
  adaptiveWeights: {
    examUrgency: 0.30,       // Closeness of subject exam date
    weakPerformance: 0.25,   // Phase 7 quiz accuracy and performance tier
    completionNeed: 0.15,    // Incomplete syllabus percentage
    inactivity: 0.10,        // Days since last Phase 4 study session
    difficulty: 0.10,        // Technical nuance / subject difficulty
    missedPressure: 0.10     // Unfinished / repeatedly missed task pressure
  },

  // Phase 7 Performance Tier to Priority Factor Mapping
  performanceTierWeights: {
    WEAK: 1.00,             // Critical knowledge gap: highest attention
    NEEDS_PRACTICE: 0.70,   // Sub-70% accuracy: requires reinforcement
    AVERAGE: 0.35,          // Moderate competence: standard maintenance
    STRONG: 0.10,           // High retention (>=85%): lowest priority
    UNASSESSED: 0.50        // Neutral baseline when no quizzes taken yet
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

  // Phase 8 Adaptive Scheduling Parameters
  adaptiveScheduling: {
    minStudyBlockMinutes: 20,       // Minimum block size for split tasks
    maxStudyBlockMinutes: 90,       // Maximum continuous topic block before splitting
    recentActivityDays: 14,         // Lookback window for Phase 4 study sessions
    recentQuizLookbackDays: 30,     // Lookback window for Phase 7 quiz performance
    defaultPlanningHorizonDays: 7,  // Standard 7-day adaptive horizon
    maxPlanningHorizonDays: 14,     // Maximum allowed planning horizon
    observedCapacityAdjustmentFactor: 1.15 // Conservative elasticity on observed minutes
  },

  // Normalized difficulty factor mapping (Phase 5 legacy)
  difficultyWeights: {
    EASY: 0.33,
    MEDIUM: 0.66,
    HARD: 1.00
  },

  // Phase 8 Adaptive Difficulty Weights
  adaptiveDifficultyWeights: {
    EASY: 0.20,
    MEDIUM: 0.60,
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

  // Source identifiers
  source: 'RULE_ENGINE',
  sources: {
    RULE_ENGINE: 'RULE_ENGINE',
    ADAPTIVE_ENGINE: 'ADAPTIVE_ENGINE',
    AI: 'AI'
  }
};

export default PLANNER_CONFIG;
