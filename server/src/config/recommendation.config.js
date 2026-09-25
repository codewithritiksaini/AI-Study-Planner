/**
 * recommendation.config.js
 *
 * Centralized configuration for Phase 10: Personalized Recommendation & Smart Study Action Engine.
 * All thresholds, priority factor ranges, scoring tiers, and duration bounds are centralized here.
 * No magic numbers should be scattered across services.
 */

export const recommendationConfig = {
  // Recommendation types
  TYPES: {
    WEAK_TOPIC: 'WEAK_TOPIC',
    UNFINISHED_TOPIC: 'UNFINISHED_TOPIC',
    EXAM_PREPARATION: 'EXAM_PREPARATION',
    REVISION: 'REVISION',
    QUIZ_PRACTICE: 'QUIZ_PRACTICE',
    BACKLOG: 'BACKLOG',
    STUDY_BALANCE: 'STUDY_BALANCE',
    PLAN_ADJUSTMENT: 'PLAN_ADJUSTMENT',
    CONSISTENCY: 'CONSISTENCY',
    TOPIC_REVIEW: 'TOPIC_REVIEW',
    SUBJECT_REVIEW: 'SUBJECT_REVIEW'
  },

  // Priority tiers
  PRIORITY: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
  },

  // Thresholds for priority tiers based on calculated numeric priority score (0 - 100)
  PRIORITY_SCORE_THRESHOLDS: {
    HIGH: 65.0,
    MEDIUM: 40.0,
    LOW: 0.0
  },

  // Priority scoring factor ranges (Sums up to 100 max)
  SCORING_WEIGHTS: {
    EXAM_FACTOR_MAX: 40,        // 0 to 40 points
    WEAKNESS_FACTOR_MAX: 25,    // 0 to 25 points
    INCOMPLETION_FACTOR_MAX: 20,// 0 to 20 points
    BACKLOG_FACTOR_MAX: 10,     // 0 to 10 points
    RECENCY_FACTOR_MAX: 5       // 0 to 5 points
  },

  // Exam urgency thresholds and category mapping
  EXAM_THRESHOLDS: {
    TODAY_DAYS: 0,
    SOON_DAYS: 3,
    APPROACHING_DAYS: 7,
    LOOKAHEAD_DAYS: 30
  },

  // Weak topic detection configuration
  WEAK_TOPIC_CONFIG: {
    ACCURACY_THRESHOLD: 60.0,   // Below 60% accuracy is flagged as weak
    MIN_REQUIRED_ATTEMPTS: 1,   // Requires at least 1 verified quiz attempt
    HIGH_PRIORITY_ACCURACY: 45.0// Below 45% gets maximum weakness weight
  },

  // Unfinished topic configuration
  UNFINISHED_TOPIC_CONFIG: {
    MIN_COMPLETION_PERCENTAGE: 1,  // Partially started
    MAX_COMPLETION_PERCENTAGE: 99  // Not yet completed
  },

  // Revision recommendation configuration
  REVISION_CONFIG: {
    REVISION_AFTER_DAYS: 14,       // Completed topic not reviewed for 14+ days
    URGENT_REVISION_DAYS: 28       // Completed topic not reviewed for 28+ days
  },

  // Quiz practice recommendation configuration
  QUIZ_PRACTICE_CONFIG: {
    MIN_STUDY_EXPOSURE_MINUTES: 20,// Studied topic for at least 20 min
    MAX_QUIZ_ATTEMPTS: 0          // Zero recorded quiz attempts
  },

  // Backlog recommendation configuration
  BACKLOG_CONFIG: {
    MIN_PENDING_MISSED_TASKS: 3,  // Threshold to trigger backlog alert
    LOOKBACK_DAYS: 14             // Window of past tasks to evaluate
  },

  // Study balance configuration
  STUDY_BALANCE_CONFIG: {
    MIN_TOTAL_STUDY_MINUTES: 120, // Only evaluate balance after 2+ hours of study
    MAX_SUBJECT_SHARE: 0.70       // Flag if single subject consumes > 70% while others have exams
  },

  // Duration sizing bounds (in minutes)
  DURATION_BOUNDS: {
    MIN_MINUTES: 10,
    MAX_MINUTES: 90,
    DEFAULT_MINUTES: 30
  },

  // Engine ranking & diversity limits
  LIMITS: {
    DEFAULT_CANDIDATE_LIMIT: 5,   // Default top N recommendations returned to client
    MAX_PER_TYPE: 2,              // Diversity filter: max 2 of the same recommendation type
    DASHBOARD_LIMIT: 3            // Recommendations previewed on main dashboard
  },

  // Rule engine metadata
  VERSION: 'v1'
};

export default recommendationConfig;
