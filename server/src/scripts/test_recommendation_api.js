import { query } from '../config/db.js';
import { createSessionToken } from '../utils/token.js';

const BASE_URL = 'http://localhost:5000/api/recommendations';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runApiTests() {
  console.log('🧪 Testing Phase 10: Recommendation REST APIs & Cross-Tenant Security...');

  // 1. Setup authenticated User A (student@gmail.com)
  const userARes = await query(`SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
  if (userARes.rows.length === 0) {
    throw new Error('Seed student user not found');
  }
  const userA = userARes.rows[0];
  const tokenA = createSessionToken({
    id: userA.id,
    email: userA.email,
    user_metadata: userA.raw_user_meta_data || {}
  });

  // 2. Setup secondary User B for cross-tenant isolation testing
  const tokenB = createSessionToken({
    id: '00000000-0000-0000-0000-000000000002',
    email: 'userb@example.com',
    user_metadata: {}
  });

  const headersA = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenA}`
  };

  const headersB = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenB}`
  };

  // --------------------------------------------------------------------------
  // TEST 1: GET /api/recommendations (Unauthenticated should return 401)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 1: Unauthenticated Guard ---');
  const unauthRes = await fetch(BASE_URL);
  assert(unauthRes.status === 401, `Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  console.log('✅ Unauthenticated access blocked with 401.');

  // --------------------------------------------------------------------------
  // TEST 2: POST /api/recommendations/refresh (Generate fresh set)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: POST /api/recommendations/refresh ---');
  const refreshRes = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ limit: 4 })
  });
  assert(refreshRes.status === 200, `Expected 200 on refresh, got ${refreshRes.status}`);
  const refreshJson = await refreshRes.json();
  assert(refreshJson.success === true, 'Response success should be true');
  assert(Array.isArray(refreshJson.recommendations), 'recommendations should be an array');
  assert(refreshJson.recommendations.length > 0, 'Should return at least 1 recommendation');
  const targetRec = refreshJson.recommendations[0];
  console.log(`✅ Recommendations refreshed (${refreshJson.recommendations.length} items). Top item: "${targetRec.title}"`);

  // --------------------------------------------------------------------------
  // TEST 3: GET /api/recommendations (Active list with limit)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: GET /api/recommendations ---');
  const getRes = await fetch(`${BASE_URL}?limit=2`, {
    method: 'GET',
    headers: headersA
  });
  assert(getRes.status === 200, `Expected 200 on GET, got ${getRes.status}`);
  const getJson = await getRes.json();
  assert(getJson.success === true, 'Response success should be true');
  assert(getJson.recommendations.length <= 2, 'Limit query param should restrict count to <= 2');
  console.log(`✅ GET /api/recommendations returned ${getJson.recommendations.length} active items (limit: 2).`);

  // --------------------------------------------------------------------------
  // TEST 4: GET /api/recommendations/:id (Detail view)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: GET /api/recommendations/:id ---');
  const detailRes = await fetch(`${BASE_URL}/${targetRec.id}`, {
    method: 'GET',
    headers: headersA
  });
  assert(detailRes.status === 200, `Expected 200 on detail, got ${detailRes.status}`);
  const detailJson = await detailRes.json();
  assert(detailJson.recommendation.id === targetRec.id, 'Returned ID must match requested ID');
  assert(detailJson.recommendation.reason_json !== undefined, 'Must include reason_json');
  console.log('✅ GET /api/recommendations/:id returned full recommendation details.');

  // --------------------------------------------------------------------------
  // TEST 5: Security / Multi-Tenant Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: Cross-Tenant Isolation (User B accessing User A item) ---');
  const crossRes = await fetch(`${BASE_URL}/${targetRec.id}`, {
    method: 'GET',
    headers: headersB
  });
  assert(crossRes.status === 404, `User B should not access User A item; expected 404, got ${crossRes.status}`);
  console.log('✅ User B cannot access User A recommendation (404 Not Found / Access Denied).');

  // --------------------------------------------------------------------------
  // TEST 6: POST /api/recommendations/:id/feedback
  // --------------------------------------------------------------------------
  console.log('\n--- Test 6: POST /api/recommendations/:id/feedback ---');
  // Invalid feedback enum
  const badFeedbackRes = await fetch(`${BASE_URL}/${targetRec.id}/feedback`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ feedback: 'INVALID_ENUM' })
  });
  assert(badFeedbackRes.status === 400, `Expected 400 for invalid feedback enum, got ${badFeedbackRes.status}`);

  // Valid feedback
  const goodFeedbackRes = await fetch(`${BASE_URL}/${targetRec.id}/feedback`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ feedback: 'HELPFUL' })
  });
  assert(goodFeedbackRes.status === 200, `Expected 200 for valid feedback, got ${goodFeedbackRes.status}`);
  console.log('✅ Feedback validation and recording verified.');

  // --------------------------------------------------------------------------
  // TEST 7: POST /api/recommendations/:id/complete
  // --------------------------------------------------------------------------
  console.log('\n--- Test 7: POST /api/recommendations/:id/complete ---');
  const completeRes = await fetch(`${BASE_URL}/${targetRec.id}/complete`, {
    method: 'POST',
    headers: headersA
  });
  assert(completeRes.status === 200, `Expected 200 on complete, got ${completeRes.status}`);
  const completeJson = await completeRes.json();
  assert(completeJson.recommendation.status === 'COMPLETED', 'Status should be COMPLETED');
  console.log('✅ Marked recommendation as COMPLETED.');

  // --------------------------------------------------------------------------
  // TEST 8: GET /api/recommendations/history
  // --------------------------------------------------------------------------
  console.log('\n--- Test 8: GET /api/recommendations/history ---');
  const historyRes = await fetch(`${BASE_URL}/history`, {
    method: 'GET',
    headers: headersA
  });
  assert(historyRes.status === 200, `Expected 200 on history, got ${historyRes.status}`);
  const historyJson = await historyRes.json();
  assert(historyJson.history.some((h) => h.id === targetRec.id), 'History should contain completed recommendation');
  console.log(`✅ History endpoint returned ${historyJson.history.length} items including completed recommendation.`);

  // --------------------------------------------------------------------------
  // TEST 9: GET /api/recommendations/metrics/summary
  // --------------------------------------------------------------------------
  console.log('\n--- Test 9: GET /api/recommendations/metrics/summary ---');
  const metricsRes = await fetch(`${BASE_URL}/metrics/summary`, {
    method: 'GET',
    headers: headersA
  });
  assert(metricsRes.status === 200, `Expected 200 on metrics summary, got ${metricsRes.status}`);
  const metricsJson = await metricsRes.json();
  assert(typeof metricsJson.metrics.completion_rate === 'number', 'completion_rate should be numeric');
  assert(typeof metricsJson.metrics.helpfulness_rate === 'number', 'helpfulness_rate should be numeric');
  console.log('📊 Quality & Engagement Metrics API response:');
  console.log(`  - Total: ${metricsJson.metrics.total_recommendations}`);
  console.log(`  - Active: ${metricsJson.metrics.active_recommendations}`);
  console.log(`  - Completed: ${metricsJson.metrics.completed_recommendations}`);
  console.log(`  - Completion Rate: ${metricsJson.metrics.completion_rate}%`);
  console.log(`  - Helpfulness Rate: ${metricsJson.metrics.helpfulness_rate}%`);

  console.log('\n🎉 Task 6: Backend API Layer & Security Tests PASSED 100%!\n');
  process.exit(0);
}

runApiTests().catch((err) => {
  console.error('❌ Task 6 Test failed:', err.stack || err);
  process.exit(1);
});
