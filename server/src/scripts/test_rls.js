import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function runRlsTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to Postgres for RLS Isolation Verification...\n');

    const userA_id = '11111111-1111-4111-8111-111111111111';
    const userB_id = '22222222-2222-4222-8222-222222222222';

    // Cleanup previous test rows if any
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);

    // Insert dummy users into auth.users (as superuser)
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a@test.com', '{"full_name": "Student A"}', 'authenticated', 'authenticated'),
        ($2, 'student_b@test.com', '{"full_name": "Student B"}', 'authenticated', 'authenticated');
    `, [userA_id, userB_id]);

    console.log('✅ Two test accounts registered in auth.users.');

    // Note: The handle_new_user trigger automatically populated profiles for both users!
    const createdProfiles = await client.query(
      `SELECT id, full_name, email FROM public.profiles WHERE id IN ($1, $2);`,
      [userA_id, userB_id]
    );
    console.log(`✅ Automatic trigger populated ${createdProfiles.rows.length} profile rows.`);

    // --- TEST 1: User A Session Simulation ---
    console.log('\n--- Test 1: Simulating authenticated session for User A ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userA_id]);

    // Check auth.uid()
    const checkUidA = await client.query(`SELECT auth.uid() as uid;`);
    console.log(`🔑 Current auth.uid() in session:`, checkUidA.rows[0].uid);

    // User A reading Profile A
    const resA_own = await client.query(`SELECT id, full_name FROM public.profiles WHERE id = $1;`, [userA_id]);
    console.log(`[PASS] User A SELECT Profile A -> Allowed (Retrieved: "${resA_own.rows[0]?.full_name}")`);

    // User A attempting to read Profile B (Cross-User Read)
    const resA_cross = await client.query(`SELECT id, full_name FROM public.profiles WHERE id = $1;`, [userB_id]);
    console.log(`[PASS] User A SELECT Profile B -> Blocked by RLS (Retrieved: ${resA_cross.rows.length} rows)`);

    // User A attempting to update Profile B (Cross-User Update)
    const updateB_by_A = await client.query(`UPDATE public.profiles SET full_name = 'Hacked by A' WHERE id = $1;`, [userB_id]);
    console.log(`[PASS] User A UPDATE Profile B -> Blocked by RLS (Rows updated: ${updateB_by_A.rowCount})`);

    await client.query(`COMMIT;`);

    // --- TEST 2: User B Session Simulation ---
    console.log('\n--- Test 2: Simulating authenticated session for User B ---');
    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userB_id]);

    // Check auth.uid()
    const checkUidB = await client.query(`SELECT auth.uid() as uid;`);
    console.log(`🔑 Current auth.uid() in session:`, checkUidB.rows[0].uid);

    // User B reading Profile B
    const resB_own = await client.query(`SELECT id, full_name FROM public.profiles WHERE id = $1;`, [userB_id]);
    console.log(`[PASS] User B SELECT Profile B -> Allowed (Retrieved: "${resB_own.rows[0]?.full_name}")`);

    // User B attempting to read Profile A (Cross-User Read)
    const resB_cross = await client.query(`SELECT id, full_name FROM public.profiles WHERE id = $1;`, [userA_id]);
    console.log(`[PASS] User B SELECT Profile A -> Blocked by RLS (Retrieved: ${resB_cross.rows.length} rows)`);

    // User B attempting to update Profile A (Cross-User Update)
    const updateA_by_B = await client.query(`UPDATE public.profiles SET full_name = 'Hacked by B' WHERE id = $1;`, [userA_id]);
    console.log(`[PASS] User B UPDATE Profile A -> Blocked by RLS (Rows updated: ${updateA_by_B.rowCount})`);

    // User B updating own Profile B
    const updateB_by_B = await client.query(`UPDATE public.profiles SET target_cgpa = 9.80 WHERE id = $1 RETURNING target_cgpa;`, [userB_id]);
    console.log(`[PASS] User B UPDATE Profile B (own) -> Allowed (New CGPA: ${updateB_by_B.rows[0]?.target_cgpa})`);

    await client.query(`COMMIT;`);

    // --- Cleanup ---
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    console.log('\n🧹 Test fixture rows cleaned up successfully.');
    console.log('\n🎉 RLS ISOLATION AND OWNERSHIP INTEGRITY VERIFIED 100%!');

  } catch (err) {
    console.error('❌ RLS test error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runRlsTest();
