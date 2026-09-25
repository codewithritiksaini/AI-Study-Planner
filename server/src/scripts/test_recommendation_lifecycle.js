import { query } from '../config/db.js';
import { generateDeterministicExplanation, enhanceExplanationWithAI } from '../services/recommendations/recommendation-explanation.service.js';
import { recommendationLifecycleService } from '../services/recommendations/recommendation-lifecycle.service.js';
import { recommendationEngineService } from '../services/recommendations/recommendation-engine.service.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testLifecycleAndExplanations() {
  console.log('🧪 Testing Phase 10: Recommendation Explanations, Lifecycle & Engine...');

  // ==========================================
  // UNIT TEST 1: Deterministic Explanations
  // ==========================================
  console.log('\n--- Test 1: Deterministic Explanations Across Types ---');
  const sampleWeak = {
    type: 'WEAK_TOPIC',
    title: 'Review Normalization',
    message: 'Quiz score below threshold',
    reason: { quiz_average: 46, attempt_count: 2, days_until_exam: 5 }
  };
  const expWeak = generateDeterministicExplanation(sampleWeak);
  assert(expWeak.reason_bullets.length >= 2, 'Weak topic should generate at least 2 reason bullets');
  assert(expWeak.reason_bullets.some((b) => b.includes('46%')), 'Bullet must contain exact quiz accuracy 46%');

  const sampleExam = {
    type: 'EXAM_PREPARATION',
    title: 'Prepare for OS Exam',
    message: 'Exam approaching',
    reason: { days_until_exam: 3, incomplete_topics_count: 4 }
  };
  const expExam = generateDeterministicExplanation(sampleExam);
  assert(expExam.reason_bullets.some((b) => b.includes('3 days')), 'Bullet must contain exact 3 days deadline');
  console.log('✅ Deterministic explanations generate verifiable fact bullets directly from metrics.');

  // ==========================================
  // UNIT TEST 2: Fallback Resilience
  // ==========================================
  console.log('\n--- Test 2: AI Enhancer Fallback Resilience ---');
  const candidate = {
    type: 'QUIZ_PRACTICE',
    title: 'Practice CPU Scheduling',
    message: 'Test your understanding',
    reason: { study_minutes_recorded: 40 }
  };
  const enhanced = await enhanceExplanationWithAI(candidate);
  assert(enhanced.explanation && enhanced.explanation.reason_bullets, 'Should always return structured explanation');
  assert(['AI_ENHANCED', 'DETERMINISTIC', 'DETERMINISTIC_FALLBACK'].includes(enhanced.explanation.source), 'Source must be valid');
  console.log(`✅ Explanation completed safely with source: ${enhanced.explanation.source}`);

  // ==========================================
  // INTEGRATION TEST: Database Lifecycle Transitions
  // ==========================================
  console.log('\n--- Test 3: Database Lifecycle & Feedback Tracking ---');
  const userRes = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
  const userId = userRes.rows[0].id;

  // 1. Run master recommendation engine
  const recommendations = await recommendationEngineService.refreshRecommendations(userId, { limit: 4 });
  assert(recommendations.length > 0, 'Engine should return at least 1 recommendation');
  const testRec = recommendations[0];
  console.log(`✅ Successfully generated and persisted ${recommendations.length} recommendations. Top ID: ${testRec.id}`);

  // 2. Query active recommendations
  const activeList = await recommendationLifecycleService.getActiveRecommendations(userId);
  assert(activeList.length === recommendations.length, 'Active recommendations count should match persisted count');
  console.log(`✅ Retrieved ${activeList.length} active recommendations from database.`);

  // 3. Test recordFeedback (HELPFUL)
  await recommendationLifecycleService.recordFeedback(userId, testRec.id, 'HELPFUL');
  console.log('✅ Recorded HELPFUL feedback.');

  // 4. Test status transition to COMPLETED
  const completedRec = await recommendationLifecycleService.updateStatus(userId, testRec.id, 'COMPLETED');
  assert(completedRec.status === 'COMPLETED', 'Status should be COMPLETED');
  console.log('✅ Updated recommendation status to COMPLETED.');

  // 5. Test history retrieval
  const history = await recommendationLifecycleService.getHistory(userId);
  assert(history.some((h) => h.id === testRec.id && h.status === 'COMPLETED'), 'History should include completed item');
  console.log(`✅ Recommendation history retrieved (${history.length} items).`);

  // 6. Test system quality stats
  const stats = await recommendationLifecycleService.getRecommendationStats(userId);
  assert(stats.total_recommendations >= 1, 'Total recommendations should be >= 1');
  assert(stats.completed_recommendations >= 1, 'Completed count should be >= 1');
  assert(stats.helpful_count >= 1, 'Helpful count should be >= 1');
  assert(typeof stats.completion_rate === 'number', 'Completion rate must be numeric');
  assert(typeof stats.helpfulness_rate === 'number', 'Helpfulness rate must be numeric');
  console.log('📊 Quality & Engagement Metrics:');
  console.log(`  - Total: ${stats.total_recommendations}`);
  console.log(`  - Active: ${stats.active_recommendations}`);
  console.log(`  - Completed: ${stats.completed_recommendations}`);
  console.log(`  - Completion Rate: ${stats.completion_rate}%`);
  console.log(`  - Helpfulness Rate: ${stats.helpfulness_rate}%`);

  console.log('\n🎉 Task 5: Explanations, Lifecycle & Master Engine PASSED 100%!\n');
  process.exit(0);
}

testLifecycleAndExplanations().catch((err) => {
  console.error('❌ Task 5 Test failed:', err.stack || err);
  process.exit(1);
});
