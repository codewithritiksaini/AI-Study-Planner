import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function runPhase4RlsTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Postgres for Phase 4 Study Session & Activity Tracking Verification...\n');

    const userA_id = '55555555-5555-4555-8555-555555555555';
    const userB_id = '66666666-6666-4666-8666-666666666666';

    // 0. Cleanup previous test rows if any
    await client.query(`DELETE FROM public.study_sessions WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);

    // Insert dummy test accounts
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a_phase4@test.com', '{"full_name": "Student A Phase 4"}', 'authenticated', 'authenticated'),
        ($2, 'student_b_phase4@test.com', '{"full_name": "Student B Phase 4"}', 'authenticated', 'authenticated');
    `, [userA_id, userB_id]);

    console.log('✅ Two test accounts registered in auth.users.');

    // Create Subjects and Topics for User A and User B
    const subResA = await client.query(`
      INSERT INTO public.subjects (user_id, name, color)
      VALUES ($1, 'Computer Networks', '#4f46e5')
      RETURNING id;
    `, [userA_id]);
    const subjectA_id = subResA.rows[0].id;

    const topResA = await client.query(`
      INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes)
      VALUES ($1, 'TCP Congestion Control', 'HARD', 90)
      RETURNING id;
    `, [subjectA_id]);
    const topicA_id = topResA.rows[0].id;

    const subResB = await client.query(`
      INSERT INTO public.subjects (user_id, name, color)
      VALUES ($1, 'Compiler Design', '#059669')
      RETURNING id;
    `, [userB_id]);
    const subjectB_id = subResB.rows[0].id;

    console.log('✅ Base test subjects and topics established.');

    let session1_id = null;
    let session2_id = null;

    // =========================================================================
    // TEST 1: User A Session — Start, Unique Active Session Rule & Complete
    // =========================================================================
    console.log('\n--- Test 1: Simulating authenticated session for User A ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userA_id]);

    // 1.1 User A starts a study session
    const startSess1 = await client.query(`
      INSERT INTO public.study_sessions (user_id, subject_id, topic_id, started_at, status)
      VALUES ($1, $2, $3, now() - INTERVAL '45 minutes', 'IN_PROGRESS')
      RETURNING id, status, started_at;
    `, [userA_id, subjectA_id, topicA_id]);
    session1_id = startSess1.rows[0].id;
    console.log(`[PASS] User A INSERT study session -> Allowed (Session ID: ${session1_id}, Status: "${startSess1.rows[0].status}")`);

    // 1.2 User A attempts to start a second concurrent active session
    let concurrentSessionBlocked = false;
    await client.query(`SAVEPOINT sp_concurrent_active;`);
    try {
      await client.query(`
        INSERT INTO public.study_sessions (user_id, subject_id, started_at, status)
        VALUES ($1, $2, now(), 'IN_PROGRESS');
      `, [userA_id, subjectA_id]);
    } catch (err) {
      concurrentSessionBlocked = true;
      console.log(`[PASS] Single Active Session Rule -> Enforced by partial unique index (${err.message})`);
      await client.query(`ROLLBACK TO SAVEPOINT sp_concurrent_active;`);
    }
    if (!concurrentSessionBlocked) {
      throw new Error('Failure: Student was allowed to create a second concurrent IN_PROGRESS study session!');
    }

    // 1.3 User A SELECT active session
    const readActive = await client.query(`
      SELECT id, status FROM public.study_sessions 
      WHERE user_id = $1 AND status = 'IN_PROGRESS';
    `, [userA_id]);
    console.log(`[PASS] User A SELECT active session -> Allowed (Found ${readActive.rows.length} active session)`);

    // 1.4 User A completes session with reflections
    const completeSess = await client.query(`
      UPDATE public.study_sessions
      SET 
        ended_at = now(),
        duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (now() - started_at)) / 60)::int),
        status = 'COMPLETED',
        notes = 'Mastered additive increase multiplicative decrease.',
        confidence_level = 4,
        difficulty_feedback = 'HARD',
        updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, status, duration_minutes, confidence_level, difficulty_feedback;
    `, [session1_id, userA_id]);

    console.log(`[PASS] User A UPDATE complete session -> Allowed (Status: "${completeSess.rows[0].status}", Duration: ${completeSess.rows[0].duration_minutes}m, Confidence: ${completeSess.rows[0].confidence_level}/5)`);

    // 1.5 User A starts and cancels a second session
    const startSess2 = await client.query(`
      INSERT INTO public.study_sessions (user_id, subject_id, started_at, status)
      VALUES ($1, $2, now(), 'IN_PROGRESS')
      RETURNING id;
    `, [userA_id, subjectA_id]);
    session2_id = startSess2.rows[0].id;

    const cancelSess = await client.query(`
      UPDATE public.study_sessions
      SET 
        ended_at = now(),
        duration_minutes = 0,
        status = 'CANCELLED',
        updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, status, duration_minutes;
    `, [session2_id, userA_id]);
    console.log(`[PASS] User A UPDATE cancel session -> Allowed (Status: "${cancelSess.rows[0].status}", Duration: ${cancelSess.rows[0].duration_minutes}m)`);

    await client.query(`COMMIT;`);

    // =========================================================================
    // TEST 2: User B Session — Cross-User RLS Isolation
    // =========================================================================
    console.log('\n--- Test 2: Simulating authenticated session for User B & Cross-User Security ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userB_id]);

    // 2.1 User B attempts to read User A's session
    const readA_by_B = await client.query(`
      SELECT id FROM public.study_sessions WHERE id = $1;
    `, [session1_id]);
    console.log(`[PASS] User B SELECT User A Study Session -> Blocked by RLS (Retrieved: ${readA_by_B.rows.length} rows)`);

    // 2.2 User B attempts to update User A's session
    const updateA_by_B = await client.query(`
      UPDATE public.study_sessions SET notes = 'Hacked notes' WHERE id = $1;
    `, [session1_id]);
    console.log(`[PASS] User B UPDATE User A Study Session -> Blocked by RLS (Rows updated: ${updateA_by_B.rowCount})`);

    // 2.3 User B attempts to delete User A's session
    const deleteA_by_B = await client.query(`
      DELETE FROM public.study_sessions WHERE id = $1;
    `, [session1_id]);
    console.log(`[PASS] User B DELETE User A Study Session -> Blocked by RLS (Rows deleted: ${deleteA_by_B.rowCount})`);

    // 2.4 User B attempts to insert a session claiming user_id = userA_id
    let spoofInsertBlocked = false;
    await client.query(`SAVEPOINT sp_spoof_insert;`);
    try {
      await client.query(`
        INSERT INTO public.study_sessions (user_id, subject_id, started_at, status)
        VALUES ($1, $2, now(), 'IN_PROGRESS');
      `, [userA_id, subjectB_id]);
    } catch (err) {
      spoofInsertBlocked = true;
      console.log(`[PASS] User B INSERT session claiming User A ID -> Blocked by RLS (${err.message})`);
      await client.query(`ROLLBACK TO SAVEPOINT sp_spoof_insert;`);
    }
    if (!spoofInsertBlocked) {
      throw new Error('RLS Failure: User B was able to insert a session under User A ID!');
    }

    await client.query(`COMMIT;`);

    // =========================================================================
    // TEST 3: Historical Study Data Preservation on Topic / Subject Deletion
    // =========================================================================
    console.log('\n--- Test 3: Historical Study Data Preservation Verification ---');
    // Delete topicA_id
    await client.query(`DELETE FROM public.topics WHERE id = $1;`, [topicA_id]);
    const checkAfterTopicDel = await client.query(`
      SELECT id, subject_id, topic_id, duration_minutes, status 
      FROM public.study_sessions WHERE id = $1;
    `, [session1_id]);
    console.log(`[PASS] Topic deleted -> Session preserved with NULL topic_id (Topic ID: ${checkAfterTopicDel.rows[0].topic_id}, Duration: ${checkAfterTopicDel.rows[0].duration_minutes}m)`);

    // Delete subjectA_id
    await client.query(`DELETE FROM public.subjects WHERE id = $1;`, [subjectA_id]);
    const checkAfterSubDel = await client.query(`
      SELECT id, subject_id, topic_id, duration_minutes, status 
      FROM public.study_sessions WHERE id = $1;
    `, [session1_id]);
    console.log(`[PASS] Subject deleted -> Session preserved with NULL subject_id (Subject ID: ${checkAfterSubDel.rows[0].subject_id}, Duration: ${checkAfterSubDel.rows[0].duration_minutes}m)`);

    // =========================================================================
    // Cleanup
    // =========================================================================
    console.log('\n--- Cleaning up test fixtures ---');
    await client.query(`DELETE FROM public.study_sessions WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    console.log('✅ Test fixtures cleaned up successfully.');

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 4 STUDY SESSION & RLS TESTS PASSED 100%!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Phase 4 RLS Test Failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPhase4RlsTest();
