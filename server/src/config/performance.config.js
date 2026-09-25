/**
 * Centralized Topic Performance Configuration
 * Defines deterministic scoring weights, sliding window sizes, and mastery tier thresholds.
 */
export const PERFORMANCE_CONFIG = {
  // Weighted performance calculation: 60% recent attempts + 40% historical average
  weights: {
    recent: 0.60,
    historical: 0.40
  },

  // Window size for computing recent performance
  recentWindowSize: 3,

  // Performance level classification thresholds
  thresholds: {
    WEAK: 50.0,           // < 50.0% -> WEAK
    NEEDS_PRACTICE: 70.0, // 50.0% to 69.99% -> NEEDS_PRACTICE
    AVERAGE: 85.0,        // 70.0% to 84.99% -> AVERAGE
    STRONG: 100.0         // >= 85.0% -> STRONG
  },

  levels: {
    WEAK: 'WEAK',
    NEEDS_PRACTICE: 'NEEDS_PRACTICE',
    AVERAGE: 'AVERAGE',
    STRONG: 'STRONG'
  }
};
