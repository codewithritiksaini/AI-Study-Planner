import assert from 'assert';
import { query } from '../config/db.js';
import { profileService } from '../services/profile.service.js';
import { createSessionToken, verifySessionToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

async function runPhase1Verification() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING PHASE 1 RBAC & AUTH INTEGRATION VERIFICATION TEST');
  console.log('🧪 ========================================================\n');

  // TEST 1: Database Column Existence & Types
  console.log('--- Test 1.1: Database Schema Check ---');
  const colCheck = await query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role';
  `);
  assert.strictEqual(colCheck.rows.length, 1, 'Column "role" must exist in public.profiles');
  console.log('✅ Column public.profiles.role exists (Type:', colCheck.rows[0].data_type, ', Default:', colCheck.rows[0].column_default, ')');

  // TEST 2: Admin and Student Role Distributions in DB
  console.log('\n--- Test 1.2: User Role Assignment in DB ---');
  const adminUser = await query(`SELECT id, email, role FROM public.profiles WHERE LOWER(email) = 'wopipi3442@omanarts.com' LIMIT 1;`);
  assert.strictEqual(adminUser.rows.length, 1, 'Admin user wopipi3442@omanarts.com must exist');
  assert.strictEqual(adminUser.rows[0].role, 'admin', 'Ritik Saini must have role: admin');
  console.log('✅ Admin User verified:', adminUser.rows[0]);

  const studentUser = await query(`SELECT id, email, role FROM public.profiles WHERE LOWER(email) != 'wopipi3442@omanarts.com' LIMIT 1;`);
  assert.strictEqual(studentUser.rows[0].role, 'student', 'Regular student must have role: student');
  console.log('✅ Student User verified:', studentUser.rows[0]);

  // TEST 3: Profile Service Output
  console.log('\n--- Test 1.3: Profile Service Query ---');
  const adminProfile = await profileService.getProfileByUserId(adminUser.rows[0].id);
  assert.strictEqual(adminProfile.role, 'admin', 'ProfileService must return role: admin');
  console.log('✅ ProfileService returned admin role successfully');

  // TEST 4: Token Generation & Verification
  console.log('\n--- Test 1.4: Session Token Encoding ---');
  const adminToken = createSessionToken({
    id: adminUser.rows[0].id,
    email: adminUser.rows[0].email,
    role: 'admin'
  });
  const decodedAdmin = verifySessionToken(adminToken);
  assert.strictEqual(decodedAdmin.app_role, 'admin', 'Token must contain app_role: admin');

  const studentToken = createSessionToken({
    id: studentUser.rows[0].id,
    email: studentUser.rows[0].email,
    role: 'student'
  });
  const decodedStudent = verifySessionToken(studentToken);
  assert.strictEqual(decodedStudent.app_role, 'student', 'Token must contain app_role: student');
  console.log('✅ Signed tokens correctly encode app_role for both admin and student');

  // TEST 5: Middleware Security Chain (requireAuth + requireAdmin)
  console.log('\n--- Test 1.5: Middleware Chain RBAC Protection ---');

  function createMockRes() {
    return {
      statusCode: null,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; }
    };
  }

  // 5a. Student Token through requireAuth + requireAdmin
  const studentReq = { headers: { authorization: `Bearer ${studentToken}` } };
  const studentRes = createMockRes();
  await requireAuth(studentReq, studentRes, async () => {
    await requireAdmin(studentReq, studentRes, () => {});
  });
  assert.strictEqual(studentRes.statusCode, 403, 'Student user MUST receive 403 Forbidden');
  assert.strictEqual(studentRes.body.error.code, 'FORBIDDEN', 'Error code must be FORBIDDEN');
  console.log('✅ Student user successfully blocked with HTTP 403 Forbidden:', studentRes.body.error.message);

  // 5b. Admin Token through requireAuth + requireAdmin
  const adminReq = { headers: { authorization: `Bearer ${adminToken}` } };
  const adminRes = createMockRes();
  let adminAccessGranted = false;
  await requireAuth(adminReq, adminRes, async () => {
    await requireAdmin(adminReq, adminRes, () => {
      adminAccessGranted = true;
    });
  });
  assert.strictEqual(adminAccessGranted, true, 'Admin user MUST pass through middleware');
  console.log('✅ Admin user granted access through middleware successfully');

  // 5c. Missing Token through requireAuth
  const unauthReq = { headers: {} };
  const unauthRes = createMockRes();
  await requireAuth(unauthReq, unauthRes, () => {});
  assert.strictEqual(unauthRes.statusCode, 401, 'Missing token MUST receive 401 Unauthorized');
  console.log('✅ Unauthenticated request blocked with HTTP 401 Unauthorized');

  console.log('\n========================================================');
  console.log('🎉 ALL PHASE 1 RBAC VERIFICATION TESTS PASSED (100%)');
  console.log('========================================================\n');
  process.exit(0);
}

runPhase1Verification().catch((err) => {
  console.error('❌ Phase 1 Verification Failed:', err);
  process.exit(1);
});
