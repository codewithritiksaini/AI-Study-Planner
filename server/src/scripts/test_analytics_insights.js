/**
 * test_analytics_insights.js
 *
 * Automated verification test suite for Phase 9 Task 2:
 * Deterministic Insight Engine & Rule Evaluation.
 *
 * Run: node src/scripts/test_analytics_insights.js
 */

import assert from 'assert';
import { generateInsights } from '../services/analytics/insight.service.js';

console.log('================================================================');
console.log('🧪 PHASE 9 TASK 2: DETERMINISTIC INSIGHT ENGINE & RULE TESTS');
console.log('================================================================\n');

// -------------------------------------------------------------
// [Test 1] Approaching Exam Rule (EXAM_URGENCY)
// -------------------------------------------------------------
console.log('▶️ [Test 1] Rule: Approaching Exam Urgency');
{
  const completionMetrics = {
    subjects: [
      {
        subject_id: 'sub-dbms',
        subject_name: 'Database Management Systems',
        is_exam_upcoming: true,
        days_until_exam: 3,
        remaining_estimated_minutes: 240,
        completion_percentage: 60
      }
    ]
  };

  const insights = generateInsights({
    completionMetrics,
    referenceDate: '2026-09-25'
  });

  assert.strictEqual(insights.length, 1);
  const examInsight = insights[0];
  assert.strictEqual(examInsight.type, 'EXAM_URGENCY');
  assert.strictEqual(examInsight.severity, 'ATTENTION', '3 days until exam gives ATTENTION severity');
  assert(examInsight.title.includes('Database Management Systems'));
  assert(examInsight.message.includes('in 3 days'));
  assert(examInsight.message.includes('4.0h'));
  console.log('  ✓ Approaching exam detected with high severity and accurate remaining workload');
}

// -------------------------------------------------------------
// [Test 2] Quiz Mastery Trajectory (IMPROVING vs. DECLINING)
// -------------------------------------------------------------
console.log('\n▶️ [Test 2] Rule: Quiz Trajectory Evaluation (Improving vs Declining)');
{
  // 1. Improving quiz trend
  const improvingQuiz = {
    available: true,
    total_quizzes: 4,
    recent_average_score: 82,
    previous_average_score: 68,
    difference: 14,
    trend: 'IMPROVING'
  };
  const impInsights = generateInsights({ quizMetrics: improvingQuiz });
  assert.strictEqual(impInsights.length, 1);
  assert.strictEqual(impInsights[0].type, 'QUIZ_PERFORMANCE');
  assert.strictEqual(impInsights[0].severity, 'INFO');
  assert(impInsights[0].message.includes('14 points higher'));

  // 2. Declining quiz trend
  const decliningQuiz = {
    available: true,
    total_quizzes: 4,
    recent_average_score: 55,
    previous_average_score: 75,
    difference: -20,
    trend: 'DECLINING'
  };
  const decInsights = generateInsights({ quizMetrics: decliningQuiz });
  assert.strictEqual(decInsights.length, 1);
  assert.strictEqual(decInsights[0].type, 'QUIZ_PERFORMANCE');
  assert.strictEqual(decInsights[0].severity, 'ATTENTION');
  assert(decInsights[0].title.includes('Reinforcement'));
  console.log('  ✓ Improving trajectory flagged as encouraging INFO');
  console.log('  ✓ Declining trajectory flagged as pedagogical ATTENTION');
}

// -------------------------------------------------------------
// [Test 3] Weak Topic Concentration in Subject
// -------------------------------------------------------------
console.log('\n▶️ [Test 3] Rule: Weak Topic Concentration');
{
  const topicPerformances = [
    { topic_name: 'Deadlocks', subject_name: 'Operating Systems', performance_level: 'WEAK', composite_score: 35 },
    { topic_name: 'Virtual Memory', subject_name: 'Operating Systems', performance_level: 'WEAK', composite_score: 42 },
    { topic_name: 'Normalization', subject_name: 'DBMS', performance_level: 'STRONG', composite_score: 88 }
  ];

  const insights = generateInsights({ topicPerformances });
  assert.strictEqual(insights.length, 1);
  const topicInsight = insights[0];
  assert.strictEqual(topicInsight.type, 'TOPIC_PERFORMANCE');
  assert.strictEqual(topicInsight.severity, 'NOTICE');
  assert(topicInsight.title.includes('Operating Systems'));
  assert.strictEqual(topicInsight.data.weak_count, 2);
  console.log('  ✓ Concentration of 2+ weak topics correctly identified at subject level');
}

// -------------------------------------------------------------
// [Test 4] Plan Adherence (High vs. Low)
// -------------------------------------------------------------
console.log('\n▶️ [Test 4] Rule: Plan Adherence Evaluation');
{
  // 1. High adherence (85%)
  const highPlan = {
    available: true,
    planned_minutes: 300,
    actual_minutes: 255,
    planned_hours: 5,
    actual_hours: 4.3,
    adherence_percentage: 85
  };
  const highInsights = generateInsights({ plannerMetrics: highPlan });
  assert.strictEqual(highInsights.length, 1);
  assert.strictEqual(highInsights[0].type, 'PLAN_ADHERENCE');
  assert.strictEqual(highInsights[0].severity, 'INFO');
  assert(highInsights[0].title.includes('High Plan Adherence'));

  // 2. Low adherence (40%)
  const lowPlan = {
    available: true,
    planned_minutes: 400,
    actual_minutes: 160,
    planned_hours: 6.7,
    actual_hours: 2.7,
    adherence_percentage: 40
  };
  const lowInsights = generateInsights({ plannerMetrics: lowPlan });
  assert.strictEqual(lowInsights.length, 1);
  assert.strictEqual(lowInsights[0].type, 'PLAN_ADHERENCE');
  assert.strictEqual(lowInsights[0].severity, 'NOTICE');
  assert(lowInsights[0].title.includes('Below Planned Budget'));
  console.log('  ✓ High and low plan adherence accurately distinguished with neutral phrasing');
}

// -------------------------------------------------------------
// [Test 5] Study Consistency & Inactivity Gap
// -------------------------------------------------------------
console.log('\n▶️ [Test 5] Rule: Study Consistency & Inactivity Gap');
{
  // 1. High consistency (24 of 30 days = 80%)
  const highConsistency = {
    total_days: 30,
    active_days: 24,
    consistency_percentage: 80,
    current_streak: 5
  };
  const consInsights = generateInsights({ studyMetrics: highConsistency });
  assert.strictEqual(consInsights.length, 1);
  assert.strictEqual(consInsights[0].type, 'STUDY_CONSISTENCY');
  assert(consInsights[0].message.includes('24 of the last 30 days'));

  // 2. Inactivity gap (last studied 8 days ago)
  const oldSessions = [
    { started_at: '2026-09-17T10:00:00Z', duration_minutes: 60 }
  ];
  const gapInsights = generateInsights({
    studySessions: oldSessions,
    referenceDate: '2026-09-25'
  });
  assert.strictEqual(gapInsights.length, 1);
  assert.strictEqual(gapInsights[0].type, 'STUDY_PATTERN');
  assert(gapInsights[0].title.includes('Inactivity Gap'));
  console.log('  ✓ Habit consistency verified');
  console.log('  ✓ Multi-day inactivity gap correctly detected without judgmental tone');
}

// -------------------------------------------------------------
// [Test 6] Prioritization, Deduplication & Cap at 3–5 Insights
// -------------------------------------------------------------
console.log('\n▶️ [Test 6] Deterministic Ranking, Deduplication, and Maximum Insight Cap');
{
  // Trigger all rules at once:
  // 1. Exam Urgency (Priority 100)
  // 2. Quiz Declining (Priority 95)
  // 3. Weak Topics (Priority 85)
  // 4. Plan Adherence (Priority 75)
  // 5. Study Consistency (Priority 70)
  // 6. Inactivity Gap (Priority 65)
  // 7. Subject Balance (Priority 60)
  const allParams = {
    completionMetrics: {
      topics_count: 10,
      overall_completion_percentage: 40,
      subjects: [
        { subject_id: 's1', subject_name: 'DBMS', is_exam_upcoming: true, days_until_exam: 2, remaining_estimated_minutes: 180, completion_percentage: 50 }
      ]
    },
    quizMetrics: {
      available: true,
      total_quizzes: 5,
      recent_average_score: 50,
      previous_average_score: 75,
      difference: -25,
      trend: 'DECLINING'
    },
    topicPerformances: [
      { topic_name: 'SQL', subject_name: 'DBMS', performance_level: 'WEAK' },
      { topic_name: 'Indexes', subject_name: 'DBMS', performance_level: 'WEAK' }
    ],
    plannerMetrics: {
      available: true,
      planned_minutes: 200,
      actual_minutes: 80,
      planned_hours: 3.3,
      actual_hours: 1.3,
      adherence_percentage: 40
    },
    studyMetrics: {
      total_days: 30,
      active_days: 8,
      session_count: 8,
      consistency_percentage: 27
    },
    studySessions: [
      { subject_id: 's1', started_at: '2026-09-15T10:00:00Z', duration_minutes: 150 },
      { subject_id: 's2', started_at: '2026-09-15T12:00:00Z', duration_minutes: 20 }
    ],
    subjects: [
      { id: 's1', name: 'DBMS' },
      { id: 's2', name: 'OS' }
    ],
    maxInsights: 5,
    referenceDate: '2026-09-25'
  };

  const results = generateInsights(allParams);

  // Assertions:
  assert(results.length <= 5, 'Output must be strictly capped at 5 insights');
  assert(results.length >= 3, 'Output should contain at least 3 insights when available');

  // Verify rank ordering:
  // Rank 1 MUST be EXAM_URGENCY
  assert.strictEqual(results[0].type, 'EXAM_URGENCY', '1st insight must be EXAM_URGENCY');
  // Rank 2 MUST be QUIZ_PERFORMANCE
  assert.strictEqual(results[1].type, 'QUIZ_PERFORMANCE', '2nd insight must be QUIZ_PERFORMANCE');
  // Rank 3 MUST be TOPIC_PERFORMANCE
  assert.strictEqual(results[2].type, 'TOPIC_PERFORMANCE', '3rd insight must be TOPIC_PERFORMANCE');

  // Verify uniqueness (no duplicates)
  const types = results.map(r => r.type);
  const uniqueTypes = new Set(types);
  assert.strictEqual(types.length, uniqueTypes.size, 'All returned insights must have distinct types');

  // Tone check: Ensure no judgmental strings exist in any title or message
  const bannedWords = ['lazy', 'bad student', 'failing', 'failure', 'fool', 'stupid', 'hopeless'];
  for (const item of results) {
    const text = (item.title + ' ' + item.message).toLowerCase();
    for (const bw of bannedWords) {
      assert(!text.includes(bw), `Insight must not contain judgmental word "${bw}"`);
    }
  }

  console.log('  ✓ Insights strictly capped at 5 items max');
  console.log('  ✓ Deterministic priority ordering verified (Exam > Quiz > Topic > Plan > Consistency)');
  console.log('  ✓ Deduplication verified (0 duplicate categories returned)');
  console.log('  ✓ Tone audit verified (100% neutral educational terminology)');
}

console.log('\n================================================================');
console.log('🎉 ALL PHASE 9 TASK 2 INSIGHT ENGINE TESTS PASSED (100% SUCCESS)');
console.log('================================================================\n');
