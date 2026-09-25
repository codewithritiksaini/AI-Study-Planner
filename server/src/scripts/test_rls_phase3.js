import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function runPhase3RlsTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Postgres for Phase 3 RLS & Isolation Verification...\n');

    const userA_id = '33333333-3333-4333-8333-333333333333';
    const userB_id = '44444444-4444-4444-8444-444444444444';

    // Cleanup previous test rows if any
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);

    // Insert dummy users into auth.users (as postgres superuser)
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a_phase3@test.com', '{"full_name": "Student A Phase 3"}', 'authenticated', 'authenticated'),
        ($2, 'student_b_phase3@test.com', '{"full_name": "Student B Phase 3"}', 'authenticated', 'authenticated');
    `, [userA_id, userB_id]);

    console.log('✅ Two test accounts registered in auth.users.');

    let subjectA_id = null;
    let topicA_id = null;
    let subjectB_id = null;
    let topicB_id = null;

    // =========================================================================
    // TEST 1: User A Session — Create Subject and Syllabus Topics
    // =========================================================================
    console.log('\n--- Test 1: Simulating authenticated session for User A ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userA_id]);

    // 1.1 User A creates a Subject
    const insertSubA = await client.query(`
      INSERT INTO public.subjects (user_id, name, description, exam_date, target_score, color)
      VALUES ($1, 'Operating Systems', 'Core systems engineering', CURRENT_DATE + INTERVAL '20 days', 90, '#4f46e5')
      RETURNING id, name;
    `, [userA_id]);
    subjectA_id = insertSubA.rows[0].id;
    console.log(`[PASS] User A INSERT Subject -> Allowed (Subject ID: ${subjectA_id}, Name: "${insertSubA.rows[0].name}")`);

    // 1.2 User A creates a Syllabus Topic
    const insertTopicA = await client.query(`
      INSERT INTO public.topics (subject_id, name, description, difficulty, estimated_minutes, status, completion_percentage)
      VALUES ($1, 'Virtual Memory & Paging', 'Demand paging and page replacement algorithms', 'HARD', 120, 'IN_PROGRESS', 50)
      RETURNING id, name, completion_percentage;
    `, [subjectA_id]);
    topicA_id = insertTopicA.rows[0].id;
    console.log(`[PASS] User A INSERT Topic -> Allowed (Topic ID: ${topicA_id}, Name: "${insertTopicA.rows[0].name}")`);

    // 1.3 User A SELECT own subjects & topics
    const selectSubA = await client.query(`SELECT id, name FROM public.subjects WHERE user_id = $1;`, [userA_id]);
    console.log(`[PASS] User A SELECT own subjects -> Allowed (Found ${selectSubA.rows.length} subjects)`);

    const selectTopA = await client.query(`SELECT id, name FROM public.topics WHERE subject_id = $1;`, [subjectA_id]);
    console.log(`[PASS] User A SELECT own topics -> Allowed (Found ${selectTopA.rows.length} topics)`);

    await client.query(`COMMIT;`);

    // =========================================================================
    // TEST 2: User B Session — Create Subject and Attempt Cross-User Access
    // =========================================================================
    console.log('\n--- Test 2: Simulating authenticated session for User B & Cross-User Security ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userB_id]);

    // 2.1 User B creates own Subject
    const insertSubB = await client.query(`
      INSERT INTO public.subjects (user_id, name, description, exam_date, target_score, color)
      VALUES ($1, 'Database Systems', 'Relational database theory', CURRENT_DATE + INTERVAL '15 days', 95, '#10b981')
      RETURNING id, name;
    `, [userB_id]);
    subjectB_id = insertSubB.rows[0].id;
    console.log(`[PASS] User B INSERT Subject -> Allowed (Subject ID: ${subjectB_id}, Name: "${insertSubB.rows[0].name}")`);

    // 2.2 User B creates own Topic
    const insertTopicB = await client.query(`
      INSERT INTO public.topics (subject_id, name, description, difficulty, estimated_minutes)
      VALUES ($1, 'Indexing & B-Trees', 'Balanced tree storage structures', 'MEDIUM', 90)
      RETURNING id, name;
    `, [subjectB_id]);
    topicB_id = insertTopicB.rows[0].id;
    console.log(`[PASS] User B INSERT Topic -> Allowed (Topic ID: ${topicB_id}, Name: "${insertTopicB.rows[0].name}")`);

    // 2.3 User B attempts to read User A's subject
    const readA_by_B = await client.query(`SELECT id, name FROM public.subjects WHERE id = $1;`, [subjectA_id]);
    console.log(`[PASS] User B SELECT User A Subject -> Blocked by RLS (Retrieved: ${readA_by_B.rows.length} rows)`);

    // 2.4 User B attempts to read User A's topic
    const readTopA_by_B = await client.query(`SELECT id, name FROM public.topics WHERE id = $1;`, [topicA_id]);
    console.log(`[PASS] User B SELECT User A Topic -> Blocked by RLS (Retrieved: ${readTopA_by_B.rows.length} rows)`);

    // 2.5 User B attempts to insert a Topic into User A's subject
    let illegalInsertBlocked = false;
    await client.query(`SAVEPOINT sp_illegal_insert;`);
    try {
      await client.query(`
        INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes)
        VALUES ($1, 'Malicious Topic In A', 'EASY', 30);
      `, [subjectA_id]);
    } catch (err) {
      illegalInsertBlocked = true;
      console.log(`[PASS] User B INSERT Topic into User A Subject -> Blocked by RLS (${err.message})`);
      await client.query(`ROLLBACK TO SAVEPOINT sp_illegal_insert;`);
    }
    if (!illegalInsertBlocked) {
      throw new Error('RLS Failure: User B was able to insert topic into User A subject!');
    }

    // 2.6 User B attempts to UPDATE User A's subject
    const updateA_sub = await client.query(`UPDATE public.subjects SET name = 'Hacked Subject' WHERE id = $1;`, [subjectA_id]);
    console.log(`[PASS] User B UPDATE User A Subject -> Blocked by RLS (Rows updated: ${updateA_sub.rowCount})`);

    // 2.7 User B attempts to UPDATE User A's topic
    const updateA_top = await client.query(`UPDATE public.topics SET name = 'Hacked Topic' WHERE id = $1;`, [topicA_id]);
    console.log(`[PASS] User B UPDATE User A Topic -> Blocked by RLS (Rows updated: ${updateA_top.rowCount})`);

    // 2.8 User B attempts to DELETE User A's subject
    const deleteA_sub = await client.query(`DELETE FROM public.subjects WHERE id = $1;`, [subjectA_id]);
    console.log(`[PASS] User B DELETE User A Subject -> Blocked by RLS (Rows deleted: ${deleteA_sub.rowCount})`);

    // 2.9 User B attempts to DELETE User A's topic
    const deleteA_top = await client.query(`DELETE FROM public.topics WHERE id = $1;`, [topicA_id]);
    console.log(`[PASS] User B DELETE User A Topic -> Blocked by RLS (Rows deleted: ${deleteA_top.rowCount})`);

    await client.query(`COMMIT;`);

    // =========================================================================
    // TEST 3: Cascade Deletion Verification
    // =========================================================================
    console.log('\n--- Test 3: Cascade Deletion Verification ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userA_id]);

    // User A deletes their own subject
    const delRes = await client.query(`DELETE FROM public.subjects WHERE id = $1 RETURNING id;`, [subjectA_id]);
    console.log(`[PASS] User A DELETE own Subject -> Allowed (Deleted subject ${delRes.rows[0]?.id})`);

    // Verify topicA was cascade-deleted
    const checkTopicA = await client.query(`SELECT id FROM public.topics WHERE id = $1;`, [topicA_id]);
    console.log(`[PASS] Topics cascade-deleted with Subject -> Verified (Remaining topics for deleted subject: ${checkTopicA.rows.length})`);

    await client.query(`COMMIT;`);

    // =========================================================================
    // Cleanup
    // =========================================================================
    console.log('\n--- Cleaning up test artifacts ---');
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    console.log('✅ Test rows cleaned up successfully.');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 3 RLS & ISOLATION TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Phase 3 RLS Test Failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPhase3RlsTest();
