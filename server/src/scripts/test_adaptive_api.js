import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateAdaptivePlan,
  regenerateAdaptivePlan,
  getAdaptiveToday,
  getAdaptiveWeek,
  updatePlanStatus,
  explainAdaptivePlan
} from '../controllers/adaptive-planner.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

// Helper to create mock Express req/res
function createMockReqRes({ body = {}, query = {}, params = {}, user = null } = {}) {
  const req = {
    body,
    query,
    params,
    user
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  let nextCalled = false;
  let nextError = null;
  const next = (err) => {
    nextCalled = true;
    nextError = err;
  };

  return { req, res, next, getNext: () => ({ nextCalled, nextError }) };
}

async function runAdaptiveApiVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 PHASE 8 TASK 3: ADAPTIVE PLANNER CONTROLLER & REST API TESTS');
  console.log('================================================================\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const testUserId = 'f1111111-1111-4111-8111-111111111111';

  try {
    // 0. Seed Test User & Curriculum
    await client.query(`DELETE FROM public.study_plans WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.topic_performance WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.study_sessions WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id = $1);`, [testUserId]);
    await client.query(`DELETE FROM public.subjects WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.profiles WHERE id = $1;`, [testUserId]);
    await client.query(`DELETE FROM auth.users WHERE id = $1;`, [testUserId]);

    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES ($1, 'api_test_student@test.com', '{"full_name": "API Student"}', 'authenticated', 'authenticated')
      ON CONFLICT (id) DO NOTHING;
    `, [testUserId]);

    await client.query(`
      UPDATE public.profiles
      SET full_name = 'API Student',
          daily_available_hours = 2.5,
          preferred_study_start_time = '17:00',
          preferred_study_end_time = '20:00'
      WHERE id = $1;
    `, [testUserId]);

    const subjRes = await client.query(`
      INSERT INTO public.subjects (user_id, name, exam_date, target_score, color)
      VALUES ($1, 'Computer Networks', (now() + interval '6 days')::date, 85, '#6366f1')
      RETURNING id;
    `, [testUserId]);
    const subjectId = subjRes.rows[0].id;

    const topicRes = await client.query(`
      INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage)
      VALUES ($1, 'TCP Congestion Control', 'HARD', 75, 20)
      RETURNING id;
    `, [subjectId]);
    const topicId = topicRes.rows[0].id;

    // Seed weak topic performance (accuracy 45%)
    await client.query(`
      INSERT INTO public.topic_performance (
        user_id, subject_id, topic_id, attempt_count, total_questions, correct_answers,
        average_percentage, recent_percentage, performance_level, confidence_score
      ) VALUES ($1, $2, $3, 1, 10, 4, 45.0, 45.0, 'WEAK', 0.80);
    `, [testUserId, subjectId, topicId]);

    // ============================================================================
    // TEST 1: POST /api/planner/adaptive/generate - Input Validation
    // ============================================================================
    console.log('▶️ [Test 1] POST /api/planner/adaptive/generate - Input Validation');

    // Case A: Invalid start_date format
    {
      const { req, res, next } = createMockReqRes({
        body: { start_date: 'invalid-date', days: 7 },
        user: { id: testUserId }
      });
      await generateAdaptivePlan(req, res, next);
      if (res.statusCode !== 400 || res.data?.error?.code !== 'VALIDATION_ERROR') {
        throw new Error(`Expected 400 VALIDATION_ERROR on invalid start_date, got ${res.statusCode}`);
      }
      console.log('  ✓ Malformed start_date rejected with 400 VALIDATION_ERROR');
    }

    // Case B: Days out of bounds (> 14)
    {
      const { req, res, next } = createMockReqRes({
        body: { days: 20 },
        user: { id: testUserId }
      });
      await generateAdaptivePlan(req, res, next);
      if (res.statusCode !== 400 || res.data?.error?.code !== 'VALIDATION_ERROR') {
        throw new Error(`Expected 400 VALIDATION_ERROR on days > 14, got ${res.statusCode}`);
      }
      console.log('  ✓ Planning horizon > 14 days rejected with 400 VALIDATION_ERROR');
    }

    // ============================================================================
    // TEST 2: POST /api/planner/adaptive/generate - Successful Generation
    // ============================================================================
    console.log('\n▶️ [Test 2] POST /api/planner/adaptive/generate - Success Response');

    let createdTasks = [];
    {
      const todayStr = new Date().toISOString().split('T')[0];
      const { req, res, next } = createMockReqRes({
        body: { start_date: todayStr, days: 5 },
        user: { id: testUserId }
      });
      await generateAdaptivePlan(req, res, next);

      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Expected 200 success on generate plan, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
      if (!Array.isArray(res.data.data.tasks) || res.data.data.tasks.length === 0) {
        throw new Error(`Expected generated tasks array in data, got: ${JSON.stringify(res.data.data)}`);
      }

      createdTasks = res.data.data.tasks;
      console.log(`  ✓ Successfully generated adaptive plan (HTTP 200) with ${createdTasks.length} tasks`);
      console.log(`  ✓ Response includes capacity metadata: ${res.data.data.capacity.effective_capacity}m capacity`);
    }

    // ============================================================================
    // TEST 3: GET /api/planner/adaptive/today - Real-time metrics & capacity
    // ============================================================================
    console.log('\n▶️ [Test 3] GET /api/planner/adaptive/today - Metrics & Tasks');

    {
      const { req, res, next } = createMockReqRes({
        user: { id: testUserId }
      });
      await getAdaptiveToday(req, res, next);

      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Expected 200 on getAdaptiveToday, got ${res.statusCode}`);
      }
      const todayData = res.data.data;
      if (typeof todayData.capacity_minutes !== 'number' || !Array.isArray(todayData.tasks)) {
        throw new Error(`Expected capacity_minutes and tasks array in payload: ${JSON.stringify(todayData)}`);
      }
      console.log(`  ✓ Today's adaptive view returned: ${todayData.tasks.length} task(s), ${todayData.capacity_minutes}m capacity`);
      console.log(`  ✓ Planned minutes: ${todayData.planned_minutes}m, Completed: ${todayData.completed_minutes}m`);
    }

    // ============================================================================
    // TEST 4: GET /api/planner/adaptive/week - 7-Day Timetable
    // ============================================================================
    console.log('\n▶️ [Test 4] GET /api/planner/adaptive/week - Weekly Timetable');

    {
      const todayStr = new Date().toISOString().split('T')[0];
      const { req, res, next } = createMockReqRes({
        query: { start_date: todayStr },
        user: { id: testUserId }
      });
      await getAdaptiveWeek(req, res, next);

      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Expected 200 on getAdaptiveWeek, got ${res.statusCode}`);
      }
      const weekData = res.data.data;
      if (!Array.isArray(weekData.days) || weekData.days.length !== 7) {
        throw new Error(`Expected 7 days in weekly payload, got ${weekData.days?.length}`);
      }
      console.log(`  ✓ 7-Day weekly timetable returned successfully (7 calendar days)`);
    }

    // ============================================================================
    // TEST 5: PATCH /api/planner/:id/status - Status Transitions & Validations
    // ============================================================================
    console.log('\n▶️ [Test 5] PATCH /api/planner/adaptive/:id/status - State Transitions');

    const firstTask = createdTasks[0];
    const taskPlanId = firstTask.id || (
      await client.query(`SELECT id FROM public.study_plans WHERE user_id = $1 LIMIT 1;`, [testUserId])
    ).rows[0]?.id;

    // Case A: Transition PENDING -> IN_PROGRESS
    {
      const { req, res, next } = createMockReqRes({
        params: { id: taskPlanId },
        body: { status: 'IN_PROGRESS' },
        user: { id: testUserId }
      });
      await updatePlanStatus(req, res, next);

      if (res.statusCode !== 200 || res.data?.data?.plan?.status !== 'IN_PROGRESS') {
        throw new Error(`Expected 200 status with IN_PROGRESS, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
      console.log('  ✓ Transitioned PENDING -> IN_PROGRESS successfully');
    }

    // Case B: Transition IN_PROGRESS -> COMPLETED
    {
      const { req, res, next } = createMockReqRes({
        params: { id: taskPlanId },
        body: { status: 'COMPLETED' },
        user: { id: testUserId }
      });
      await updatePlanStatus(req, res, next);

      if (res.statusCode !== 200 || res.data?.data?.plan?.status !== 'COMPLETED') {
        throw new Error(`Expected 200 status with COMPLETED, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
      console.log('  ✓ Transitioned IN_PROGRESS -> COMPLETED successfully');
    }

    // Case C: Invalid Status String
    {
      const { req, res, next } = createMockReqRes({
        params: { id: taskPlanId },
        body: { status: 'UNKNOWN_STATUS' },
        user: { id: testUserId }
      });
      await updatePlanStatus(req, res, next);

      if (res.statusCode !== 400 || res.data?.error?.code !== 'VALIDATION_ERROR') {
        throw new Error(`Expected 400 VALIDATION_ERROR on invalid status, got ${res.statusCode}`);
      }
      console.log('  ✓ Invalid status value rejected with 400 VALIDATION_ERROR');
    }

    // Case D: Invalid UUID param
    {
      const { req, res, next } = createMockReqRes({
        params: { id: 'not-a-uuid' },
        body: { status: 'COMPLETED' },
        user: { id: testUserId }
      });
      await updatePlanStatus(req, res, next);

      if (res.statusCode !== 400 || res.data?.error?.code !== 'INVALID_ID') {
        throw new Error(`Expected 400 INVALID_ID on bad UUID, got ${res.statusCode}`);
      }
      console.log('  ✓ Malformed UUID parameter rejected with 400 INVALID_ID');
    }

    // ============================================================================
    // TEST 6: POST /api/planner/adaptive/regenerate - Safe Recalibration
    // ============================================================================
    console.log('\n▶️ [Test 6] POST /api/planner/adaptive/regenerate - Safe Recalibration');

    {
      const todayStr = new Date().toISOString().split('T')[0];
      const { req, res, next } = createMockReqRes({
        body: { start_date: todayStr, days: 5 },
        user: { id: testUserId }
      });
      await regenerateAdaptivePlan(req, res, next);

      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Expected 200 success on regenerateAdaptivePlan, got ${res.statusCode}`);
      }

      // Verify COMPLETED task still exists in the database
      const checkCompleted = await client.query(
        `SELECT id, status FROM public.study_plans WHERE id = $1 AND status = 'COMPLETED';`,
        [taskPlanId]
      );
      if (checkCompleted.rows.length === 0) {
        throw new Error('CRITICAL BUG: Regenerate endpoint deleted or altered a COMPLETED task!');
      }
      console.log('  ✓ Safe Recalibration endpoint executed successfully (COMPLETED task strictly preserved)');
    }

    // ============================================================================
    // TEST 7: POST /api/planner/adaptive/explain - Plan Explanation Endpoint
    // ============================================================================
    console.log('\n▶️ [Test 7] POST /api/planner/adaptive/explain - Rationale Explanation');

    {
      const todayStr = new Date().toISOString().split('T')[0];
      const { req, res, next } = createMockReqRes({
        body: { plan_date: todayStr },
        user: { id: testUserId }
      });
      await explainAdaptivePlan(req, res, next);

      if (res.statusCode !== 200 || !res.data?.success) {
        throw new Error(`Expected 200 on explainAdaptivePlan, got ${res.statusCode}`);
      }
      const explanation = res.data.data;
      if (!explanation || !explanation.explanation) {
        throw new Error(`Expected explanation text in response payload, got: ${JSON.stringify(explanation)}`);
      }
      console.log(`  ✓ Plan explanation generated successfully (Source: ${explanation.source || 'RULE_ENGINE'})`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 8 TASK 3 API & CONTROLLER TESTS PASSED (100%)');
    console.log('================================================================\n');
  } finally {
    // Cleanup
    await client.query(`DELETE FROM public.study_plans WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.topic_performance WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id = $1);`, [testUserId]);
    await client.query(`DELETE FROM public.subjects WHERE user_id = $1;`, [testUserId]);
    await client.query(`DELETE FROM public.profiles WHERE id = $1;`, [testUserId]);
    await client.query(`DELETE FROM auth.users WHERE id = $1;`, [testUserId]);
    await client.end();
  }
}

runAdaptiveApiVerificationSuite().catch(err => {
  console.error('\n❌ ADAPTIVE API TEST FAILED:\n', err);
  process.exit(1);
});
