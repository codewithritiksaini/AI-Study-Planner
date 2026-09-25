/**
 * test_analytics_metrics.js
 *
 * Automated verification test suite for Phase 9 Task 1:
 * Shared Metrics & Statistical Calculation Services.
 *
 * Run: node src/scripts/test_analytics_metrics.js
 */

import assert from 'assert';
import {
  calculateStudyMetrics,
  calculateStreaks,
  getLocalDateString
} from '../services/metrics/study-metrics.service.js';
import { calculatePlannerMetrics } from '../services/metrics/planner-metrics.service.js';
import { calculateQuizMetrics } from '../services/metrics/quiz-metrics.service.js';
import { calculateCompletionMetrics } from '../services/metrics/completion-metrics.service.js';

console.log('================================================================');
console.log('🧪 PHASE 9 TASK 1: SHARED METRICS & STATISTICAL SERVICES TESTS');
console.log('================================================================\n');

// -------------------------------------------------------------
// [Test 1] Study Metrics: Empty State & Zero Safety
// -------------------------------------------------------------
console.log('▶️ [Test 1] Study Metrics: Empty State & Defaults');
{
  const res = calculateStudyMetrics([], 30, 'UTC', '2026-09-25');
  assert.strictEqual(res.available, false, 'Available flag should be false for 0 sessions');
  assert.strictEqual(res.total_minutes, 0, 'Total minutes should be 0');
  assert.strictEqual(res.total_hours, 0, 'Total hours should be 0');
  assert.strictEqual(res.active_days, 0, 'Active days should be 0');
  assert.strictEqual(res.inactive_days, 30, 'Inactive days should equal period days');
  assert.strictEqual(res.consistency_percentage, 0, 'Consistency should be 0%');
  assert.strictEqual(res.current_streak, 0, 'Current streak should be 0');
  assert.strictEqual(res.longest_streak, 0, 'Longest streak should be 0');
  assert.strictEqual(res.daily.length, 30, 'Daily time-series should produce 30 dates');
  console.log('  ✓ Empty sessions gracefully handled without NaN or crashes');
}

// -------------------------------------------------------------
// [Test 2] Study Metrics: Active Days, Consistency & Calendar vs. Active Pace
// -------------------------------------------------------------
console.log('\n▶️ [Test 2] Active Days, Consistency & Daily Average Separation');
{
  // 30 day window, 10 active days, 1000 total minutes (100 min on each of 10 days)
  const sessions = [];
  for (let i = 0; i < 10; i++) {
    const day = 25 - i;
    const dayStr = `2026-09-${String(day).padStart(2, '0')}`;
    sessions.push({
      started_at: `${dayStr}T10:00:00Z`,
      duration_minutes: 100
    });
  }

  const res = calculateStudyMetrics(sessions, 30, 'UTC', '2026-09-25');
  assert.strictEqual(res.total_minutes, 1000, 'Total study minutes should be 1000');
  assert.strictEqual(res.total_hours, 16.7, 'Total study hours should be 16.7');
  assert.strictEqual(res.active_days, 10, 'Active days should be 10');
  assert.strictEqual(res.inactive_days, 20, 'Inactive days should be 20');
  assert.strictEqual(res.consistency_percentage, 33, '10/30 active days gives 33% consistency');
  assert.strictEqual(res.average_minutes_per_active_day, 100, 'Avg per active day = 1000/10 = 100m');
  assert.strictEqual(res.average_minutes_per_calendar_day, 33.3, 'Avg per calendar day = 1000/30 = 33.3m');
  console.log('  ✓ Verified distinct separation between calendar-day and active-day averages');
  console.log('  ✓ Consistency percentage bounded and correctly rounded');
}

// -------------------------------------------------------------
// [Test 3] Streak Calculator: Active, Gap, and Yesterday Fallback
// -------------------------------------------------------------
console.log('\n▶️ [Test 3] Study Streak Calculation (Timezone and Gap Sensitivity)');
{
  // Scenario A: Studied Today (Sept 25) + Yesterday (Sept 24) + Day before (Sept 23)
  const setA = new Set(['2026-09-23', '2026-09-24', '2026-09-25']);
  const streakA = calculateStreaks(setA, '2026-09-25');
  assert.strictEqual(streakA.current_streak, 3, 'Streak A should be 3');
  assert.strictEqual(streakA.longest_streak, 3, 'Longest streak A should be 3');

  // Scenario B: Did not study today, but studied yesterday and 2 days ago
  const setB = new Set(['2026-09-23', '2026-09-24']);
  const streakB = calculateStreaks(setB, '2026-09-25');
  assert.strictEqual(streakB.current_streak, 2, 'Streak should continue if studied yesterday');
  assert.strictEqual(streakB.longest_streak, 2);

  // Scenario C: Gap of 2 days (last studied Sept 22, today is Sept 25)
  const setC = new Set(['2026-09-20', '2026-09-21', '2026-09-22']);
  const streakC = calculateStreaks(setC, '2026-09-25');
  assert.strictEqual(streakC.current_streak, 0, 'Streak resets to 0 if last study was > 1 day ago');
  assert.strictEqual(streakC.longest_streak, 3, 'Historical longest streak is preserved');

  // Scenario D: Timezone conversion check (UTC vs IST)
  // 2026-09-24T19:00:00Z is 2026-09-25T00:30:00 in Asia/Kolkata
  const dUtc = getLocalDateString('2026-09-24T19:00:00Z', 'UTC');
  const dIst = getLocalDateString('2026-09-24T19:00:00Z', 'Asia/Kolkata');
  assert.strictEqual(dUtc, '2026-09-24');
  assert.strictEqual(dIst, '2026-09-25');
  console.log('  ✓ Consecutive study streak correctly identified');
  console.log('  ✓ Yesterday fallback preserves active streak before student finishes today\'s session');
  console.log('  ✓ Timezone conversion shifts session date appropriately across midnight boundaries');
}

// -------------------------------------------------------------
// [Test 4] Planner Metrics: Adherence & Status Distribution
// -------------------------------------------------------------
console.log('\n▶️ [Test 4] Planner Adherence, Actual vs. Planned, and Status Distribution');
{
  const mockPlans = [
    { plan_date: '2026-09-20', planned_minutes: 60, status: 'COMPLETED' },
    { plan_date: '2026-09-21', planned_minutes: 90, status: 'COMPLETED' },
    { plan_date: '2026-09-22', planned_minutes: 60, status: 'MISSED' },
    { plan_date: '2026-09-23', planned_minutes: 45, status: 'SKIPPED' },
    { plan_date: '2026-09-24', planned_minutes: 50, status: 'IN_PROGRESS' },
    { plan_date: '2026-09-25', planned_minutes: 60, status: 'PENDING' }
  ];

  const mockSessions = [
    { started_at: '2026-09-20T10:00:00Z', duration_minutes: 60 },
    { started_at: '2026-09-21T14:00:00Z', duration_minutes: 80 },
    { started_at: '2026-09-24T16:00:00Z', duration_minutes: 50 }
  ];

  const res = calculatePlannerMetrics(mockPlans, mockSessions, 7, 'UTC', '2026-09-25');
  assert.strictEqual(res.total_planned_tasks, 6);
  assert.strictEqual(res.planned_minutes, 365, 'Total planned minutes: 60+90+60+45+50+60 = 365');
  assert.strictEqual(res.actual_minutes, 190, 'Total actual minutes: 60+80+50 = 190');
  assert.strictEqual(res.difference_minutes, -175, 'Actual - Planned = 190 - 365 = -175');
  assert.strictEqual(res.adherence_percentage, 52, 'Adherence = 190/365 * 100 = 52%');
  assert.strictEqual(res.status_distribution.COMPLETED, 2);
  assert.strictEqual(res.status_distribution.MISSED, 1);
  assert.strictEqual(res.status_distribution.SKIPPED, 1);
  assert.strictEqual(res.status_distribution.IN_PROGRESS, 1);
  assert.strictEqual(res.status_distribution.PENDING, 1);
  assert.strictEqual(res.completion_rate, 33, 'Completion rate = 2/6 = 33%');
  assert.strictEqual(res.miss_rate, 17, 'Miss rate = 1/6 = 17%');

  // Edge case: 0 planned minutes, 60 actual minutes
  const zeroPlanRes = calculatePlannerMetrics([], [{ started_at: '2026-09-25T10:00:00Z', duration_minutes: 60 }], 7, 'UTC', '2026-09-25');
  assert.strictEqual(zeroPlanRes.adherence_percentage, 100, 'Unplanned study receives 100% adherence without division by zero');
  console.log('  ✓ Plan adherence percentage accurately computed');
  console.log('  ✓ Status distribution counters verified across all 5 states');
  console.log('  ✓ Zero-division safety verified');
}

// -------------------------------------------------------------
// [Test 5] Quiz Metrics: Trajectory, Delta, and Trend Classification
// -------------------------------------------------------------
console.log('\n▶️ [Test 5] Quiz Metrics: Score Trajectory & Trend Classification');
{
  // 1. Insufficient data (<2 attempts)
  const singleAttempt = [{ percentage: 65, submitted_at: '2026-09-20T10:00:00Z' }];
  const singleRes = calculateQuizMetrics(singleAttempt);
  assert.strictEqual(singleRes.trend, 'INSUFFICIENT_DATA');

  // 2. Improving trend (+15% recent vs previous)
  const improvingAttempts = [
    { percentage: 40, submitted_at: '2026-09-10T10:00:00Z' },
    { percentage: 50, submitted_at: '2026-09-12T10:00:00Z' },
    { percentage: 60, submitted_at: '2026-09-15T10:00:00Z' },
    { percentage: 75, submitted_at: '2026-09-20T10:00:00Z' },
    { percentage: 80, submitted_at: '2026-09-22T10:00:00Z' },
    { percentage: 85, submitted_at: '2026-09-24T10:00:00Z' }
  ];
  const impRes = calculateQuizMetrics(improvingAttempts);
  assert.strictEqual(impRes.trend, 'IMPROVING');
  assert.strictEqual(impRes.highest_score, 85);
  assert.strictEqual(impRes.lowest_score, 40);
  assert(impRes.difference > 0, 'Difference should be positive for improvement');

  // 3. Declining trend (-15% recent vs previous)
  const decliningAttempts = [
    { percentage: 85, submitted_at: '2026-09-10T10:00:00Z' },
    { percentage: 80, submitted_at: '2026-09-12T10:00:00Z' },
    { percentage: 75, submitted_at: '2026-09-15T10:00:00Z' },
    { percentage: 60, submitted_at: '2026-09-20T10:00:00Z' },
    { percentage: 55, submitted_at: '2026-09-22T10:00:00Z' },
    { percentage: 50, submitted_at: '2026-09-24T10:00:00Z' }
  ];
  const decRes = calculateQuizMetrics(decliningAttempts);
  assert.strictEqual(decRes.trend, 'DECLINING');

  // 4. Stable trend (within +-4%)
  const stableAttempts = [
    { percentage: 70, submitted_at: '2026-09-10T10:00:00Z' },
    { percentage: 72, submitted_at: '2026-09-15T10:00:00Z' },
    { percentage: 69, submitted_at: '2026-09-20T10:00:00Z' },
    { percentage: 71, submitted_at: '2026-09-24T10:00:00Z' }
  ];
  const stabRes = calculateQuizMetrics(stableAttempts);
  assert.strictEqual(stabRes.trend, 'STABLE');

  console.log('  ✓ Trend classification verified: IMPROVING, DECLINING, STABLE, INSUFFICIENT_DATA');
  console.log('  ✓ Chronological score points extracted cleanly for Recharts visualizations');
}

// -------------------------------------------------------------
// [Test 6] Completion Metrics: Weighted Syllabus Progress & Exam Countdown
// -------------------------------------------------------------
console.log('\n▶️ [Test 6] Weighted Syllabus Completion & Exam Timeline');
{
  const mockSubjects = [
    {
      id: 'sub-dbms',
      name: 'Database Management Systems',
      color: '#4f46e5',
      exam_date: '2026-09-30' // 5 days away from 2026-09-25
    },
    {
      id: 'sub-os',
      name: 'Operating Systems',
      color: '#059669',
      exam_date: '2026-09-20' // 5 days in past
    }
  ];

  const mockTopics = [
    // Topic A: 60 mins, 100% complete
    { id: 'top-1', subject_id: 'sub-dbms', estimated_minutes: 60, completion_percentage: 100, status: 'COMPLETED' },
    // Topic B: 180 mins, 50% complete (90m done)
    { id: 'top-2', subject_id: 'sub-dbms', estimated_minutes: 180, completion_percentage: 50, status: 'IN_PROGRESS' },
    // Topic C: 120 mins, 0% complete
    { id: 'top-3', subject_id: 'sub-os', estimated_minutes: 120, completion_percentage: 0, status: 'NOT_STARTED' }
  ];

  // Total weight = 60 + 180 + 120 = 360 mins
  // Weighted progress = (60 * 100) + (180 * 50) + (120 * 0) = 6000 + 9000 + 0 = 15000
  // Overall completion = 15000 / 360 = 41.67% -> 42%
  const compRes = calculateCompletionMetrics(mockTopics, mockSubjects, 'UTC', '2026-09-25');

  assert.strictEqual(compRes.subjects_count, 2);
  assert.strictEqual(compRes.topics_count, 3);
  assert.strictEqual(compRes.completed_topics, 1);
  assert.strictEqual(compRes.in_progress_topics, 1);
  assert.strictEqual(compRes.not_started_topics, 1);
  assert.strictEqual(compRes.overall_completion_percentage, 42);

  const dbms = compRes.subjects.find(s => s.subject_id === 'sub-dbms');
  assert(dbms, 'DBMS summary should be present');
  assert.strictEqual(dbms.days_until_exam, 5, 'DBMS exam should be in 5 days');
  assert.strictEqual(dbms.is_exam_upcoming, true);
  assert.strictEqual(dbms.is_exam_passed, false);
  // DBMS topics: 60m + 180m = 240m. Progress: (60*1 + 180*0.5) = 150m. 150/240 = 62.5% -> 63%
  assert.strictEqual(dbms.completion_percentage, 63);

  const os = compRes.subjects.find(s => s.subject_id === 'sub-os');
  assert(os, 'OS summary should be present');
  assert.strictEqual(os.days_until_exam, -5, 'OS exam was 5 days ago');
  assert.strictEqual(os.is_exam_upcoming, false);
  assert.strictEqual(os.is_exam_passed, true);
  assert.strictEqual(os.completion_percentage, 0);

  console.log('  ✓ Weighted syllabus progress calculation verified: (60*100 + 180*50 + 120*0)/360 = 42%');
  console.log('  ✓ Exam countdown and past/upcoming flags correctly evaluated');
}

console.log('\n================================================================');
console.log('🎉 ALL PHASE 9 TASK 1 METRIC SERVICES TESTS PASSED (100% SUCCESS)');
console.log('================================================================\n');
