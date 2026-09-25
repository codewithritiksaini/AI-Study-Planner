import {
  calculateExamUrgency,
  calculateCompletionNeed,
  calculateWeaknessScore,
  calculateInactivityScore,
  calculateAdaptiveDifficultyScore,
  calculateMissedPressure,
  calculateAdaptivePriority,
  generateAdaptiveReason
} from '../services/priority.service.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

console.log('================================================================');
console.log('🧪 PHASE 8 TASK 1: ADAPTIVE PRIORITY & FEEDBACK SIGNAL ENGINE');
console.log('================================================================\n');

const TODAY = '2026-09-25';

// -----------------------------------------------------------------------------
// Test 1: Exam Urgency Bounded Monotonic Scaling & Expired Exam Handling
// -----------------------------------------------------------------------------
console.log('▶️ [Test 1] Exam Urgency Bounded Monotonic Scaling');
const uToday = calculateExamUrgency('2026-09-25', TODAY);
const u1Day = calculateExamUrgency('2026-09-26', TODAY);
const u5Days = calculateExamUrgency('2026-09-30', TODAY);
const u15Days = calculateExamUrgency('2026-10-10', TODAY);
const u45Days = calculateExamUrgency('2026-11-09', TODAY);
const uPast = calculateExamUrgency('2026-09-20', TODAY);
const uNull = calculateExamUrgency(null, TODAY);

assert(uToday === 1.00, 'Exam today gives maximum urgency (1.00)');
assert(u1Day === 1.00, 'Exam tomorrow gives maximum urgency (1.00)');
assert(u5Days >= 0.70 && u5Days <= 0.90, `Exam in 5 days is high urgency (got ${u5Days})`);
assert(u15Days < u5Days && u15Days >= 0.40, `Exam in 15 days is moderate urgency (got ${u15Days})`);
assert(u45Days <= 0.28, `Exam in 45 days is low urgency (got ${u45Days})`);
assert(uPast === 0.10, 'Past exam is bounded at low baseline (0.10) to prevent negative values');
assert(uNull === 0.20, 'Unspecified exam date has neutral baseline (0.20)');
assert(uToday > u5Days && u5Days > u15Days && u15Days > u45Days, 'Exam urgency scales strictly monotonically with closeness');

// -----------------------------------------------------------------------------
// Test 2: Incomplete Syllabus Need Scoring
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 2] Incomplete Syllabus Need Scoring');
const c0 = calculateCompletionNeed(0);
const c50 = calculateCompletionNeed(50);
const c100 = calculateCompletionNeed(100);

assert(c0 === 1.00, '0% completion gives 1.00 need');
assert(c50 === 0.50, '50% completion gives 0.50 need');
assert(c100 === 0.00, '100% completion gives 0.00 need');

// -----------------------------------------------------------------------------
// Test 3: Weak Topic Performance & Degradation Sensitivity
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 3] Weak Topic Performance & Degradation Sensitivity');
const wUnassessed = calculateWeaknessScore(null);
const wWeak = calculateWeaknessScore({ performance_level: 'WEAK', average_percentage: 40, recent_percentage: 40 });
const wNeedsPractice = calculateWeaknessScore({ performance_level: 'NEEDS_PRACTICE', average_percentage: 60, recent_percentage: 60 });
const wAverage = calculateWeaknessScore({ performance_level: 'AVERAGE', average_percentage: 75, recent_percentage: 75 });
const wStrong = calculateWeaknessScore({ performance_level: 'STRONG', average_percentage: 90, recent_percentage: 90 });

assert(wUnassessed === 0.50, 'Unassessed topic receives neutral baseline (0.50)');
assert(wWeak === 1.00, 'WEAK topic receives maximum weakness score (1.00)');
assert(wNeedsPractice === 0.70, 'NEEDS_PRACTICE topic receives 0.70 weakness score');
assert(wAverage === 0.35, 'AVERAGE topic receives 0.35 weakness score');
assert(wStrong === 0.10, 'STRONG topic receives lowest weakness score (0.10)');

// Test rapid degradation detection (average 75%, recent 45% -> gap >= 15%)
const wDegraded = calculateWeaknessScore({
  performance_level: 'AVERAGE',
  average_percentage: 75,
  recent_percentage: 45
});
assert(wDegraded === 0.45, `Degradation detected: score adjusted from 0.35 to ${wDegraded} (+0.10 penalty)`);

// -----------------------------------------------------------------------------
// Test 4: Inactivity Score Calculation
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 4] Inactivity / Forgetting Curve Factor');
const iNever = calculateInactivityScore(null, TODAY);
const iToday = calculateInactivityScore('2026-09-25T10:00:00Z', TODAY);
const i2Days = calculateInactivityScore('2026-09-23T10:00:00Z', TODAY);
const i5Days = calculateInactivityScore('2026-09-20T10:00:00Z', TODAY);
const i10Days = calculateInactivityScore('2026-09-15T10:00:00Z', TODAY);

assert(iNever === 1.00, 'Never studied topic has maximum inactivity (1.00)');
assert(iToday === 0.20, 'Studied today has low inactivity (0.20)');
assert(i2Days === 0.50, 'Studied 2 days ago has moderate inactivity (0.50)');
assert(i5Days === 0.75, 'Studied 5 days ago has high inactivity (0.75)');
assert(i10Days === 0.95, 'Studied 10 days ago has very high inactivity (0.95)');
assert(iNever > i10Days && i10Days > i5Days && i5Days > i2Days && i2Days > iToday, 'Inactivity scales monotonically');

// -----------------------------------------------------------------------------
// Test 5: Difficulty & Missed Plan Pressure Bounds
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 5] Difficulty & Missed Pressure Bounds');
const dEasy = calculateAdaptiveDifficultyScore('EASY');
const dMed = calculateAdaptiveDifficultyScore('MEDIUM');
const dHard = calculateAdaptiveDifficultyScore('HARD');

assert(dEasy === 0.20, 'EASY difficulty mapped to 0.20');
assert(dMed === 0.60, 'MEDIUM difficulty mapped to 0.60');
assert(dHard === 1.00, 'HARD difficulty mapped to 1.00');

const m0 = calculateMissedPressure(0);
const m1 = calculateMissedPressure(1);
const m2 = calculateMissedPressure(2);
const m5 = calculateMissedPressure(5);

assert(m0 === 0.00, '0 missed plans = 0.00 pressure');
assert(m1 === 0.50, '1 missed plan = 0.50 pressure');
assert(m2 === 0.80, '2 missed plans = 0.80 pressure');
assert(m5 === 1.00, '5 missed plans = 1.00 capped pressure (prevents infinite escalation)');

// -----------------------------------------------------------------------------
// Test 6: Composite Adaptive Priority & Adaptation Scenarios
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 6] Adaptation Scenarios: Weak Topic vs Mastered Topic');

// Scenario A: Urgent, Weak Topic with Missed Plan
const planA = calculateAdaptivePriority({
  examDateStr: '2026-09-29', // 4 days away
  planningDateStr: TODAY,
  completionPercentage: 40,
  topicPerformance: { performance_level: 'WEAK', average_percentage: 38, recent_percentage: 35 },
  lastStudiedAt: '2026-09-18T00:00:00Z', // 7 days ago
  difficulty: 'HARD',
  missedCount: 1
});

assert(planA.priority_score >= 0.70, `Scenario A priority score is HIGH (got ${planA.priority_score})`);
assert(planA.priority_label === 'HIGH', 'Category label is HIGH');
assert(planA.signals.exam_urgency >= 0.70, 'Exam urgency is a primary signal');
assert(planA.signals.weakness === 1.00, 'Weakness is maximum signal');
assert(planA.driving_factors.includes('EXAM_URGENCY') && planA.driving_factors.includes('WEAK_PERFORMANCE'), 'Driving factors identified correctly');

// Scenario B: Same Topic After Mastery Improvement (Quiz = 90%, Completion = 85%)
const planB = calculateAdaptivePriority({
  examDateStr: '2026-09-29', // Same exam date
  planningDateStr: TODAY,
  completionPercentage: 85,
  topicPerformance: { performance_level: 'STRONG', average_percentage: 85, recent_percentage: 90 },
  lastStudiedAt: '2026-09-24T00:00:00Z', // Studied yesterday
  difficulty: 'HARD',
  missedCount: 0
});

assert(planB.priority_score < planA.priority_score, `Adaptive Reduction: Priority decreased from ${planA.priority_score} to ${planB.priority_score} after student achieved mastery`);
assert(planB.signals.weakness === 0.10, 'Weakness signal dropped to 0.10');

// -----------------------------------------------------------------------------
// Test 7: Explainable Reason Generation
// -----------------------------------------------------------------------------
console.log('\n▶️ [Test 7] Explainable Reason Generation');
const reasonA = generateAdaptiveReason({
  signals: planA.signals,
  subjectName: 'Database Management Systems',
  topicName: 'BCNF & 3NF Decomposition',
  examDateStr: '2026-09-29',
  planningDateStr: TODAY,
  topicPerformance: { composite_score: 35 },
  missedCount: 1
});

console.log(`  Generated Reason A: "${reasonA}"`);
assert(reasonA.includes('exam is approaching'), 'Reason reflects exam urgency');
assert(reasonA.includes('recent quiz mastery is critical (35%)') || reasonA.includes('quiz evaluation indicates foundational gaps'), 'Reason reflects weak quiz performance');

// Test Missed Recovery Reason
const reasonMissed = generateAdaptiveReason({
  signals: { exam_urgency: 0.20, weakness: 0.35, completion_need: 0.60, inactivity: 0.50, difficulty: 0.60, missed_pressure: 0.50 },
  subjectName: 'Computer Networks',
  topicName: 'TCP Congestion Control',
  missedCount: 1
});
console.log(`  Generated Reason Missed: "${reasonMissed}"`);
assert(reasonMissed.includes('previously scheduled session was missed'), 'Reason explains missed task recovery');

console.log('\n================================================================');
console.log('🎉 ALL PHASE 8 TASK 1 PRIORITY ENGINE TESTS PASSED (100% SUCCESS)');
console.log('================================================================');
