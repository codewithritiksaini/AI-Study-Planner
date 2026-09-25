import { PLANNER_CONFIG } from '../config/planner.config.js';

/**
 * Pure Priority Domain Service
 * Fully deterministic mathematical priority calculations and explainable reason generation.
 */

/**
 * 1. Exam Urgency Calculation
 * Closer exam dates yield a higher score (0.0 to 1.0).
 * - No exam date: 0.20 (lower baseline, still eligible)
 * - Past exam: 0.10 (not urgent)
 * - Exam today or tomorrow (<= 1 day): 1.00
 * - Exam in <= 7 days: 0.90 to 0.70
 * - Exam in <= 30 days: 0.60 to 0.30
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
 * 3. Difficulty Score Calculation
 * Mapped to configured weights: EASY = 0.33, MEDIUM = 0.66, HARD = 1.00.
 */
export function calculateDifficultyScore(difficulty) {
  const key = String(difficulty || 'MEDIUM').toUpperCase();
  return PLANNER_CONFIG.difficultyWeights[key] || PLANNER_CONFIG.difficultyWeights.MEDIUM;
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
 * 5. Composite Priority Score Calculation
 * Weighted sum of all 4 normalized factors.
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
 * 6. Priority Display Label
 */
export function generatePriorityLabel(score) {
  if (score >= PLANNER_CONFIG.priorityLabels.HIGH) return 'HIGH';
  if (score >= PLANNER_CONFIG.priorityLabels.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/**
 * 7. Explainable Reason Generator
 * Deterministically constructs human-readable reason string based on driving factors.
 */
export function generateReason({ urgency, completionNeed, difficulty, inactivity, subjectName, topicName, examDateStr, planningDateStr }) {
  const reasons = [];

  // Check driving factor 1: Exam urgency
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

  // Check driving factor 2: Completion need
  if (completionNeed >= 0.70) {
    const pct = Math.round((1 - completionNeed) * 100);
    reasons.push(`topic is currently ${pct}% complete`);
  }

  // Check driving factor 3: Inactivity
  if (inactivity >= 0.75) {
    reasons.push(inactivity === 1.00 ? 'topic has not been studied yet' : 'topic has not been studied recently');
  }

  // Check driving factor 4: High difficulty
  if (difficulty >= 0.90) {
    reasons.push('complex subject matter requires focused review');
  }

  if (reasons.length === 0) {
    return `Scheduled to continue steady syllabus coverage for ${subjectName}.`;
  }

  // Capitalize first letter and combine
  const primary = reasons[0];
  const secondary = reasons[1] ? ` and ${reasons[1]}` : '';
  const reasonText = `Scheduled because ${primary}${secondary}.`;
  return reasonText.charAt(0).toUpperCase() + reasonText.slice(1);
}
