import { PLANNER_CONFIG } from '../config/planner.config.js';

/**
 * Pure Priority Domain Service
 * Fully deterministic mathematical priority calculations, multi-factor adaptive
 * feedback signal integration, and explainable reason generation.
 */

// ============================================================================
// 1. SIGNAL CALCULATORS (Normalized to 0.0 – 1.0)
// ============================================================================

/**
 * 1. Exam Urgency Calculation
 * Closer exam dates yield a higher score (0.0 to 1.0).
 * - No exam date: 0.20 (lower baseline, still eligible)
 * - Past exam: 0.10 (not urgent for active preparation)
 * - Exam today or tomorrow (<= 1 day): 1.00
 * - Exam in <= 7 days: 0.90 to 0.70
 * - Exam in <= 30 days: 0.65 to 0.30
 * - Exam > 30 days: scaled smoothly down to 0.15
 */
export function calculateExamUrgency(examDateStr, planningDateStr) {
  if (!examDateStr) return 0.20;

  const examDate = new Date(examDateStr);
  const planDate = new Date(planningDateStr);

  // Normalize to date difference in full days
  const diffMs = examDate.setHours(0, 0, 0, 0) - planDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Exam date has already passed
    return 0.10;
  }
  if (diffDays <= 1) {
    return 1.00;
  }
  if (diffDays <= 7) {
    // 2 days -> 0.90, 7 days -> 0.70
    return Math.max(0.70, Number((1.0 - (diffDays - 1) * 0.05).toFixed(2)));
  }
  if (diffDays <= 30) {
    // 8 days -> 0.65, 30 days -> 0.30
    const ratio = (diffDays - 7) / 23;
    return Number((0.65 - ratio * 0.35).toFixed(2));
  }

  // > 30 days
  return Math.max(0.15, Number((0.30 - Math.min(diffDays - 30, 60) * 0.0025).toFixed(2)));
}

/**
 * 2. Completion Need Calculation
 * Higher uncompleted percentage yields higher priority (0.0 to 1.0).
 */
export function calculateCompletionNeed(completionPercentage = 0) {
  const comp = Math.max(0, Math.min(100, Number(completionPercentage) || 0));
  return Number((1 - comp / 100).toFixed(2));
}

/**
 * 3. Difficulty Score Calculation (Phase 5 Legacy Weights)
 * EASY = 0.33, MEDIUM = 0.66, HARD = 1.00
 */
export function calculateDifficultyScore(difficulty) {
  const key = String(difficulty || 'MEDIUM').toUpperCase();
  return PLANNER_CONFIG.difficultyWeights[key] || PLANNER_CONFIG.difficultyWeights.MEDIUM;
}

/**
 * 3b. Adaptive Difficulty Score Calculation (Phase 8 Normalized)
 * EASY = 0.20, MEDIUM = 0.60, HARD = 1.00
 */
export function calculateAdaptiveDifficultyScore(difficulty) {
  const key = String(difficulty || 'MEDIUM').toUpperCase();
  return PLANNER_CONFIG.adaptiveDifficultyWeights[key] || PLANNER_CONFIG.adaptiveDifficultyWeights.MEDIUM;
}

/**
 * 4. Inactivity Score Calculation
 * Topics not studied recently receive higher inactivity priority (0.0 to 1.0).
 * - Never studied: 1.00
 * - Last studied today (< 1 day): 0.20
 * - 1-3 days: 0.50
 * - 4-7 days: 0.75
 * - > 7 days: 0.95
 */
export function calculateInactivityScore(lastStudiedAt, planningDateStr) {
  if (!lastStudiedAt) return 1.00; // Never studied -> highest inactivity score

  const lastStudiedDate = new Date(lastStudiedAt);
  const planDate = new Date(planningDateStr);

  const diffMs = planDate.getTime() - lastStudiedDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 0.20;
  if (diffDays <= 3) return 0.50;
  if (diffDays <= 7) return 0.75;
  return 0.95;
}

/**
 * 5. Weak Topic Performance Score (Phase 7 Quiz Integration)
 * Directly utilizes Phase 7 topic performance tier and composite score.
 * - WEAK (<50% accuracy): 1.00
 * - NEEDS_PRACTICE (50-69% accuracy): 0.70
 * - AVERAGE (70-84% accuracy): 0.35
 * - STRONG (>=85% accuracy): 0.10
 * - UNASSESSED (no quizzes taken yet): 0.50 (neutral baseline)
 * 
 * Also detects recent performance degradation: if recent quiz score dropped
 * by >= 15% below the historical average, adds a +0.10 recency decay adjustment.
 */
export function calculateWeaknessScore(topicPerformance) {
  if (!topicPerformance) {
    return PLANNER_CONFIG.performanceTierWeights.UNASSESSED;
  }

  const level = String(topicPerformance.performance_level || 'UNASSESSED').toUpperCase();
  let baseScore = PLANNER_CONFIG.performanceTierWeights[level] ?? PLANNER_CONFIG.performanceTierWeights.UNASSESSED;

  // Sensitive trend analysis: check if recent scores show rapid decline
  const recentPct = Number(topicPerformance.recent_percentage);
  const avgPct = Number(topicPerformance.average_percentage);

  if (!isNaN(recentPct) && !isNaN(avgPct)) {
    if (avgPct - recentPct >= 15) {
      // Recent understanding has declined sharply -> add recency urgency
      baseScore = Math.min(1.00, Number((baseScore + 0.10).toFixed(2)));
    } else if (recentPct - avgPct >= 20 && baseScore > 0.10) {
      // Recent performance shows rapid mastery gain -> discount weakness
      baseScore = Math.max(0.10, Number((baseScore - 0.10).toFixed(2)));
    }
  }

  return baseScore;
}

/**
 * 6. Missed Plan Pressure Score
 * Calculates scheduling pressure from previously missed tasks.
 * Bounded to prevent infinite punitive scheduling loops.
 * - 0 missed: 0.00
 * - 1 missed: 0.50
 * - 2 missed: 0.80
 * - 3+ missed: 1.00 (capped)
 */
export function calculateMissedPressure(missedCount = 0) {
  const count = Math.max(0, Number(missedCount) || 0);
  if (count === 0) return 0.00;
  if (count === 1) return 0.50;
  if (count === 2) return 0.80;
  return 1.00;
}

// ============================================================================
// 2. COMPOSITE PRIORITY SCORING & EXPLAINABILITY
// ============================================================================

/**
 * Phase 5 Legacy Priority Score Calculation
 * Preserved for backward compatibility.
 */
export function calculatePriorityScore(urgency, completionNeed, difficulty, inactivity) {
  const { weights } = PLANNER_CONFIG;
  const score = (
    urgency * weights.examUrgency +
    completionNeed * weights.completionNeed +
    difficulty * weights.difficulty +
    inactivity * weights.inactivity
  );
  return Number(Math.max(0, Math.min(1, score)).toFixed(2));
}

/**
 * Phase 8 Multi-Factor Adaptive Priority Engine
 * Consumes all 6 feedback signals and returns normalized scores,
 * driving factors, and explainable justifications.
 */
export function calculateAdaptivePriority({
  examDateStr,
  planningDateStr,
  completionPercentage = 0,
  topicPerformance = null,
  lastStudiedAt = null,
  difficulty = 'MEDIUM',
  missedCount = 0
}) {
  const { adaptiveWeights } = PLANNER_CONFIG;

  // 1. Calculate each normalized signal (0.0 to 1.0)
  const examUrgency = calculateExamUrgency(examDateStr, planningDateStr);
  const weakness = calculateWeaknessScore(topicPerformance);
  const completionNeed = calculateCompletionNeed(completionPercentage);
  const inactivity = calculateInactivityScore(lastStudiedAt, planningDateStr);
  const difficultyScore = calculateAdaptiveDifficultyScore(difficulty);
  const missedPressure = calculateMissedPressure(missedCount);

  // 2. Compute weighted composite score
  const rawScore = (
    examUrgency * adaptiveWeights.examUrgency +
    weakness * adaptiveWeights.weakPerformance +
    completionNeed * adaptiveWeights.completionNeed +
    inactivity * adaptiveWeights.inactivity +
    difficultyScore * adaptiveWeights.difficulty +
    missedPressure * adaptiveWeights.missedPressure
  );

  const normalizedScore = Number(Math.max(0, Math.min(1, rawScore)).toFixed(3));
  const score100 = Math.round(normalizedScore * 100);

  // 3. Category label
  const priorityLabel = generatePriorityLabel(normalizedScore);

  // 4. Identify dominant driving signals
  const signals = {
    exam_urgency: examUrgency,
    weakness: weakness,
    completion_need: completionNeed,
    inactivity: inactivity,
    difficulty: difficultyScore,
    missed_pressure: missedPressure
  };

  const drivingFactors = [];
  if (examUrgency >= 0.70) drivingFactors.push('EXAM_URGENCY');
  if (weakness >= 0.70) drivingFactors.push('WEAK_PERFORMANCE');
  if (completionNeed >= 0.70) drivingFactors.push('INCOMPLETE_SYLLABUS');
  if (missedPressure >= 0.50) drivingFactors.push('MISSED_PRESSURE');
  if (inactivity >= 0.75) drivingFactors.push('INACTIVITY');
  if (difficultyScore >= 0.90) drivingFactors.push('HIGH_DIFFICULTY');

  return {
    priority_score: normalizedScore,
    priority_score_100: score100,
    priority_label: priorityLabel,
    signals,
    driving_factors: drivingFactors
  };
}

/**
 * Priority Display Category Threshold
 */
export function generatePriorityLabel(score) {
  if (score >= PLANNER_CONFIG.priorityLabels.HIGH) return 'HIGH';
  if (score >= PLANNER_CONFIG.priorityLabels.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/**
 * Phase 5 Legacy Reason Generator
 * Preserved for backward compatibility.
 */
export function generateReason({ urgency, completionNeed, difficulty, inactivity, subjectName, topicName, examDateStr, planningDateStr }) {
  const reasons = [];

  if (urgency >= 0.70 && examDateStr) {
    const examDate = new Date(examDateStr);
    const planDate = new Date(planningDateStr);
    const daysUntil = Math.max(0, Math.round((examDate.setHours(0, 0, 0, 0) - planDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)));
    if (daysUntil <= 1) {
      reasons.push(`${subjectName} exam is imminent (in ${daysUntil === 0 ? 'today' : '1 day'})`);
    } else {
      reasons.push(`${subjectName} exam is approaching in ${daysUntil} days`);
    }
  }

  if (completionNeed >= 0.70) {
    const pct = Math.round((1 - completionNeed) * 100);
    reasons.push(`topic is currently ${pct}% complete`);
  }

  if (inactivity >= 0.75) {
    reasons.push(inactivity === 1.00 ? 'topic has not been studied yet' : 'topic has not been studied recently');
  }

  if (difficulty >= 0.90) {
    reasons.push('complex subject matter requires focused review');
  }

  if (reasons.length === 0) {
    return `Scheduled to continue steady syllabus coverage for ${subjectName}.`;
  }

  const primary = reasons[0];
  const secondary = reasons[1] ? ` and ${reasons[1]}` : '';
  const reasonText = `Scheduled because ${primary}${secondary}.`;
  return reasonText.charAt(0).toUpperCase() + reasonText.slice(1);
}

/**
 * Phase 8 Adaptive Explainable Reason Generator
 * Produces structured, truthful explanations grounded in the 6 feedback signals.
 */
export function generateAdaptiveReason({
  signals,
  subjectName = 'Course',
  topicName = 'Topic',
  examDateStr = null,
  planningDateStr = new Date().toISOString().split('T')[0],
  topicPerformance = null,
  missedCount = 0
}) {
  const reasons = [];

  // Signal 1: Exam proximity
  if (signals.exam_urgency >= 0.70 && examDateStr) {
    const examDate = new Date(examDateStr);
    const planDate = new Date(planningDateStr);
    const daysUntil = Math.max(0, Math.round((examDate.setHours(0, 0, 0, 0) - planDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)));
    if (daysUntil <= 1) {
      reasons.push(`${subjectName} exam is imminent (${daysUntil === 0 ? 'today' : 'tomorrow'})`);
    } else {
      reasons.push(`${subjectName} exam is approaching in ${daysUntil} days`);
    }
  }

  // Signal 2: Weak Quiz Performance
  if (signals.weakness >= 0.70) {
    const score = topicPerformance?.composite_score ? `${Math.round(topicPerformance.composite_score)}%` : null;
    if (signals.weakness >= 0.90) {
      reasons.push(score ? `recent quiz mastery is critical (${score})` : 'quiz evaluation indicates foundational gaps');
    } else {
      reasons.push(score ? `quiz accuracy needs practice (${score})` : 'recent quiz performance requires reinforcement');
    }
  }

  // Signal 3: Missed Plan Recovery
  if (missedCount > 0) {
    reasons.push(missedCount === 1 ? 'previously scheduled session was missed' : `${missedCount} past sessions were missed`);
  }

  // Signal 4: Incomplete Syllabus
  if (signals.completion_need >= 0.70) {
    const compPct = Math.round((1 - signals.completion_need) * 100);
    reasons.push(`topic is only ${compPct}% complete`);
  }

  // Signal 5: Inactivity / Retention decay
  if (signals.inactivity >= 0.85) {
    reasons.push(signals.inactivity === 1.00 ? 'topic has never been studied' : 'topic has not been studied in over a week');
  }

  // Signal 6: High Difficulty
  if (signals.difficulty >= 0.90 && reasons.length < 2) {
    reasons.push('advanced conceptual depth requires dedicated focus');
  }

  // Fallback if no extreme signals exist
  if (reasons.length === 0) {
    return `Scheduled to maintain consistent learning cadence and curriculum progress in ${subjectName}.`;
  }

  const primary = reasons[0];
  const secondary = reasons[1] ? ` and ${reasons[1]}` : '';
  const sentence = `Scheduled because ${primary}${secondary}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
