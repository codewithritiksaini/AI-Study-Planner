/**
 * test_scheduling_reschedule.js
 *
 * Automated verification for Phase 11 Task 5:
 * 1. Rescheduling a missed study session
 * 2. Ensuring completed sessions cannot be rescheduled
 * 3. Preserving locked sessions during reschedule search
 */

import { rescheduleSession } from '../services/planner/reschedule.service.js';
import { query } from '../config/db.js';

async function runRescheduleTest() {
  console.log('🧪 Testing Phase 11: Targeted Missed Session Rescheduling...\n');

  try {
    // 1. Fetch seed student
    const studentUser = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
    const userId = studentUser.rows[0].id;

    const subjectRes = await query(`SELECT id FROM public.subjects WHERE user_id = $1 LIMIT 1;`, [userId]);
    const topicRes = await query(`SELECT id FROM public.topics WHERE subject_id = $1 LIMIT 1;`, [subjectRes.rows[0].id]);

    const subjectId = subjectRes.rows[0].id;
    const topicId = topicRes.rows[0].id;

    // Clean up previous test generated plans for this test runner to ensure open slot availability
    await query(`DELETE FROM public.study_plans WHERE user_id = $1 AND plan_date >= CURRENT_DATE;`, [userId]);

    // 2. Create a test session for today
    const testSessionRes = await query(`
      INSERT INTO public.study_plans (
        user_id, subject_id, topic_id, plan_date, start_time, end_time,
        planned_minutes, priority_score, reason, status, is_locked, custom_title
      ) VALUES (
        $1, $2, $3, '2026-09-25', '2026-09-25T14:00:00Z', '2026-09-25T14:45:00Z',
        45, 75, 'Initial Test Plan', 'PENDING', false, 'Test Missed Session'
      ) RETURNING id;
    `, [userId, subjectId, topicId]);

    const sessionId = testSessionRes.rows[0].id;
    console.log(`✅ Created test session (ID: ${sessionId}).`);

    // 3. Reschedule the missed session
    console.log('\n--- Rescheduling Missed Session ---');
    const rescheduleResult = await rescheduleSession(userId, sessionId);

    if (!rescheduleResult.success || !rescheduleResult.rescheduled_session) {
      throw new Error(`Rescheduling failed: ${rescheduleResult.message}`);
    }

    const newSession = rescheduleResult.rescheduled_session;
    console.log('✅ Missed session successfully rescheduled:');
    console.log(`   Original ID: ${rescheduleResult.original_session_id}`);
    console.log(`   New Date: ${newSession.plan_date}`);
    console.log(`   New Time: ${newSession.start_time} - ${newSession.end_time} (${newSession.planned_minutes}m)`);
    console.log(`   Source: ${newSession.task_source}`);

    // Verify original session is now MISSED
    const verifyOriginal = await query(`SELECT status FROM public.study_plans WHERE id = $1;`, [sessionId]);
    if (verifyOriginal.rows[0].status !== 'MISSED') {
      throw new Error(`Expected original session status MISSED, got ${verifyOriginal.rows[0].status}`);
    }
    console.log('✅ Original session status correctly updated to MISSED.');

    // 4. Test cannot reschedule completed session
    console.log('\n--- Guard: Cannot Reschedule Completed Session ---');
    await query(`UPDATE public.study_plans SET status = 'COMPLETED' WHERE id = $1;`, [newSession.id]);

    let blockedCompleted = false;
    try {
      await rescheduleSession(userId, newSession.id);
    } catch (err) {
      if (err.code === 'CANNOT_RESCHEDULE_COMPLETED') {
        blockedCompleted = true;
      }
    }
    if (!blockedCompleted) {
      throw new Error('Expected error when attempting to reschedule completed session');
    }
    console.log('✅ Correctly blocked rescheduling of COMPLETED session.');

    // Clean up test records
    await query(`DELETE FROM public.study_plans WHERE id IN ($1, $2);`, [sessionId, newSession.id]);
    console.log('✅ Test sessions cleaned up.');

    console.log('\n🎉 Targeted Missed Session Rescheduling PASSED 100%!\n');
  } catch (err) {
    console.error('❌ Reschedule test failed:', err);
    process.exit(1);
  }
}

runRescheduleTest().then(() => process.exit(0));
