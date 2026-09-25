/**
 * scheduler.config.js
 *
 * Centralized configuration for Phase 11: Intelligent Adaptive Study Scheduling & Daily Plan Optimization.
 * Centralizes all slot sizes, break durations, capacity constraints, deadline urgency brackets,
 * and diversity limits. Zero magic numbers scattered across services.
 */

export const schedulerConfig = {
  // Scheduling algorithm version identifier
  ALGORITHM_VERSION: 'v1',

  // Session duration bounds (in minutes)
  SESSION_BOUNDS: {
    DEFAULT_SESSION_MINUTES: 45,
    MIN_SESSION_MINUTES: 20,
    MAX_SESSION_MINUTES: 90,
    BREAK_MINUTES: 10,
    DEFAULT_MAX_DAILY_MINUTES: 180,
    HARD_DAILY_CEILING_MINUTES: 360 // 6 hours absolute maximum daily study cap
  },

  // Deadline urgency brackets and scheduling score adjustments
  DEADLINE_URGENCY: {
    CRITICAL_DAYS: 3,     // <= 3 days: Very High urgency (+25 scheduling points)
    HIGH_DAYS: 7,         // 4 - 7 days: High urgency (+15 scheduling points)
    MODERATE_DAYS: 14,    // 8 - 14 days: Moderate urgency (+5 scheduling points)
    NORMAL_DAYS: 30       // > 14 days: Normal priority
  },

  // Historical capacity and adaptation parameters
  CAPACITY_ADAPTATION: {
    LOOKBACK_DAYS: 14,            // Rolling 14-day window for observed study metrics
    ELASTICITY_FACTOR: 1.15,      // 15% allowance above observed session average
    SAFETY_BUFFER_RATIO: 0.15,    // 15% buffer left unscheduled to prevent overload
    MIN_CAPACITY_FLOOR_MINUTES: 30, // Minimum realistic daily floor
    MIN_SESSIONS_FOR_ADAPTATION: 3 // Minimum logged sessions before applying adaptive clamp
  },

  // Task source categorization
  TASK_SOURCES: {
    RECOMMENDATION: 'RECOMMENDATION',
    PLANNER: 'PLANNER',
    BACKLOG: 'BACKLOG',
    MANUAL: 'MANUAL',
    EXAM: 'EXAM',
    REVISION: 'REVISION'
  },

  // Status values
  SESSION_STATUS: {
    SCHEDULED: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    MISSED: 'MISSED',
    SKIPPED: 'SKIPPED'
  },

  // Diversity and cognitive load rules
  DIVERSITY_RULES: {
    MAX_CONSECUTIVE_SAME_SUBJECT: 2, // Max consecutive slots dedicated to one subject
    MAX_DAILY_SUBJECTS: 4            // Recommended maximum distinct subjects per day
  },

  // Default fallback availability if student has not configured public.study_availability
  DEFAULT_AVAILABILITY: [
    { day_of_week: 1, start_time: '18:00', end_time: '21:00', is_active: true }, // Monday
    { day_of_week: 2, start_time: '18:00', end_time: '21:00', is_active: true }, // Tuesday
    { day_of_week: 3, start_time: '18:00', end_time: '21:00', is_active: true }, // Wednesday
    { day_of_week: 4, start_time: '18:00', end_time: '21:00', is_active: true }, // Thursday
    { day_of_week: 5, start_time: '18:00', end_time: '21:00', is_active: true }, // Friday
    { day_of_week: 6, start_time: '10:00', end_time: '13:00', is_active: true }, // Saturday
    { day_of_week: 0, start_time: '10:00', end_time: '13:00', is_active: true }  // Sunday
  ]
};

export default schedulerConfig;
