import { query } from '../config/db.js';
import { recommendationConfig } from '../config/recommendation.config.js';
import {
  calculateExamFactor,
  calculateWeaknessFactor,
  calculateIncompletionFactor,
  calculateBacklogFactor,
  calculateRecencyFactor,
  evaluateCandidatePriority,
  calculateRealisticDuration,
  deduplicateCandidates,
  applyDiversityFilter,
  rankAndFilterRecommendations
} from '../services/recommendations/recommendation-priority.service.js';
import { buildRecommendationContext } from '../services/recommendations/recommendation-context.service.js';
import { generateRecommendationCandidates } from '../services/recommendations/recommendation-rules.service.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testRecommendationPriority() {
  console.log('🧪 Testing Phase 10: Recommendation Priority Scoring & Filtering Engine...');

  // ==========================================
  // UNIT TEST 1: Scoring Factors
  // ==========================================
  console.log('\n--- Test 1: Priority Scoring Factor Math ---');
  assert(calculateExamFactor(0) === 40, 'Exam today should yield 40 points');
  assert(calculateExamFactor(2) === 35, 'Exam in 2 days should yield 35 points');
  assert(calculateExamFactor(5) === 25, 'Exam in 5 days should yield 25 points');
  assert(calculateExamFactor(null) === 0, 'No exam should yield 0 points');

  assert(calculateWeaknessFactor({ attempt_count: 2, average_percentage: 35 }) === 25, 'Accuracy <= 40% should yield 25 points');
  assert(calculateWeaknessFactor({ attempt_count: 2, average_percentage: 55 }) === 15, 'Accuracy 55% should yield 15 points');
  assert(calculateWeaknessFactor({ attempt_count: 2, average_percentage: 95 }) === 0, 'Accuracy 95% should yield 0 points');

  assert(calculateIncompletionFactor(0, false) === 20, '0% completed should yield 20 points');
  assert(calculateIncompletionFactor(50, false) === 10, '50% completed should yield 10 points');
  assert(calculateIncompletionFactor(100, true) === 0, 'Completed topic should yield 0 points');

  assert(calculateBacklogFactor(5) === 10, '5 backlog tasks should yield 10 points');
  assert(calculateBacklogFactor(0) === 0, '0 backlog tasks should yield 0 points');

  assert(calculateRecencyFactor(30) === 5, '30 days since study should yield 5 points');
  assert(calculateRecencyFactor(2) === 0, '2 days since study should yield 0 points');
  console.log('✅ All 5 mathematical scoring factor calculators verified.');

  // ==========================================
  // UNIT TEST 2: Priority Evaluation & Tiers
  // ==========================================
  console.log('\n--- Test 2: Priority Evaluation & Tiers ---');
  const mockContext = {
    averageSessionMinutes: 45,
    subjects: [{ id: 'sub-urgent', daysUntilExam: 2 }],
    topics: [{ id: 't-weak', subject_id: 'sub-urgent', completion_percentage: 30, performance: { attempt_count: 2, average_percentage: 38 } }],
    backlogTasks: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]
  };

  const highCandidate = {
    type: recommendationConfig.TYPES.WEAK_TOPIC,
    subject_id: 'sub-urgent',
    topic_id: 't-weak',
    title: 'Review Weak Topic'
  };

  const evaluatedHigh = evaluateCandidatePriority(highCandidate, mockContext);
  assert(evaluatedHigh.priority_score >= 65, `Expected HIGH priority score >= 65, got ${evaluatedHigh.priority_score}`);
  assert(evaluatedHigh.priority === recommendationConfig.PRIORITY.HIGH, 'Tier should be HIGH');
  assert(evaluatedHigh.score_breakdown.total_score === evaluatedHigh.priority_score, 'Score breakdown total must match');
  console.log(`✅ Priority tier evaluated correctly (Score: ${evaluatedHigh.priority_score} -> Tier: ${evaluatedHigh.priority}).`);

  // ==========================================
  // UNIT TEST 3: Capacity-Aware Duration Sizing
  // ==========================================
  console.log('\n--- Test 3: Capacity-Aware Duration Sizing ---');
  const durationQuiz = calculateRealisticDuration({ type: recommendationConfig.TYPES.QUIZ_PRACTICE }, mockContext);
  assert(durationQuiz === 20, `Quiz duration should be 20 min, got ${durationQuiz}`);

  const durationRevision = calculateRealisticDuration({ type: recommendationConfig.TYPES.REVISION }, mockContext);
  assert(durationRevision === 25, `Revision duration should be 25 min, got ${durationRevision}`);

  // Test strict bounds
  const contextHugeAvg = { averageSessionMinutes: 180 };
  const boundedDuration = calculateRealisticDuration({ type: recommendationConfig.TYPES.WEAK_TOPIC }, contextHugeAvg);
  assert(boundedDuration <= 90, `Duration must not exceed MAX_MINUTES (90), got ${boundedDuration}`);
  console.log('✅ Capacity-aware duration sizing respects bounds and realistic session sizes.');

  // ==========================================
  // UNIT TEST 4: Deduplication of Overlapping Topics
  // ==========================================
  console.log('\n--- Test 4: Deduplication of Overlapping Topics ---');
  const duplicateCandidates = [
    { topic_id: 't-dup', priority_score: 50, type: 'UNFINISHED_TOPIC', reason: { comp: 40 } },
    { topic_id: 't-dup', priority_score: 75, type: 'WEAK_TOPIC', reason: { quiz: 45 } },
    { topic_id: 't-other', priority_score: 60, type: 'QUIZ_PRACTICE', reason: { exp: 30 } }
  ];

  const deduped = deduplicateCandidates(duplicateCandidates);
  assert(deduped.length === 2, `Expected 2 deduplicated candidates, got ${deduped.length}`);
  const mergedTopic = deduped.find((c) => c.topic_id === 't-dup');
  assert(mergedTopic.priority_score === 75, 'Should retain highest priority score');
  assert(mergedTopic.reason.comp === 40 && mergedTopic.reason.quiz === 45, 'Reasons should be merged');
  console.log('✅ Deduplication successfully merges overlapping topic recommendations.');

  // ==========================================
  // UNIT TEST 5: Diversity Filtering
  // ==========================================
  console.log('\n--- Test 5: Diversity Filtering ---');
  const manyWeakCandidates = [
    { type: 'WEAK_TOPIC', priority_score: 90 },
    { type: 'WEAK_TOPIC', priority_score: 85 },
    { type: 'WEAK_TOPIC', priority_score: 80 },
    { type: 'WEAK_TOPIC', priority_score: 75 },
    { type: 'EXAM_PREPARATION', priority_score: 70 },
    { type: 'QUIZ_PRACTICE', priority_score: 65 },
    { type: 'REVISION', priority_score: 60 }
  ];

  const diversified = applyDiversityFilter(manyWeakCandidates, 5);
  const weakCount = diversified.filter((c) => c.type === 'WEAK_TOPIC').length;
  assert(weakCount <= 2, `Expected max 2 WEAK_TOPIC in first pass, got ${weakCount}`);
  assert(diversified.some((c) => c.type === 'EXAM_PREPARATION'), 'Should include EXAM_PREPARATION');
  assert(diversified.some((c) => c.type === 'QUIZ_PRACTICE'), 'Should include QUIZ_PRACTICE');
  console.log('✅ Diversity filter prevents monoculture and enforces balanced study action mix.');

  // ==========================================
  // INTEGRATION TEST: End-to-End Ranking with Live Context
  // ==========================================
  console.log('\n--- Test 6: End-to-End Ranking with Live Database Context ---');
  const userRes = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
  const userId = userRes.rows[0].id;
  const liveContext = await buildRecommendationContext(userId);
  const rawCandidates = generateRecommendationCandidates(liveContext);

  const finalRanked = rankAndFilterRecommendations(rawCandidates, liveContext, 5);
  assert(finalRanked.length > 0, 'Expected at least 1 final recommendation');
  assert(finalRanked.length <= 5, 'Final recommendations must not exceed limit 5');

  console.log(`\n🏆 Final Prioritized Recommendations (${finalRanked.length}):`);
  for (let i = 0; i < finalRanked.length; i++) {
    const r = finalRanked[i];
    console.log(`  ${i + 1}. [${r.priority}] (${r.priority_score} pts) ${r.title} — ${r.estimated_minutes} min [${r.type}]`);
    console.log(`     Action: ${r.action.type} (${r.action.path})`);
  }

  // Verify descending order
  for (let i = 1; i < finalRanked.length; i++) {
    assert(finalRanked[i - 1].priority_score >= finalRanked[i].priority_score, 'Recommendations must be sorted descending by priority score');
  }
  console.log('✅ Verified recommendations are sorted strictly by priority score descending.');

  console.log('\n🎉 Task 4: Priority Scoring, Capacity Sizing, Deduplication & Diversity PASSED 100%!\n');
  process.exit(0);
}

testRecommendationPriority().catch((err) => {
  console.error('❌ Task 4 Test failed:', err.stack || err);
  process.exit(1);
});
