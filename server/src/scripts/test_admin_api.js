import assert from 'assert';
import { query } from '../config/db.js';
import { createSessionToken } from '../utils/token.js';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testAdminApi() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING PHASE 2 ADMIN API & SECURITY VERIFICATION TEST');
  console.log('🧪 ========================================================\n');

  // 1. Fetch Admin and Student identities from DB
  const adminRes = await query(`SELECT id, email, role FROM public.profiles WHERE role = 'admin' LIMIT 1;`);
  assert.strictEqual(adminRes.rows.length, 1, 'Admin user must exist in DB');
  const admin = adminRes.rows[0];

  const studentRes = await query(`SELECT id, email, role FROM public.profiles WHERE role = 'student' LIMIT 1;`);
  assert.strictEqual(studentRes.rows.length, 1, 'Student user must exist in DB');
  const student = studentRes.rows[0];

  const adminToken = createSessionToken({ id: admin.id, email: admin.email, role: 'admin' });
  const studentToken = createSessionToken({ id: student.id, email: student.email, role: 'student' });

  // TEST 9.1: Student trying to access /api/admin/overview -> MUST be 403 Forbidden
  console.log('--- Test 9.1: Student Access to /api/admin/overview ---');
  const studentOverviewRes = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentOverviewRes.status, 403, `Student must receive 403, got ${studentOverviewRes.status}`);
  const studentOverviewJson = await studentOverviewRes.json();
  assert.strictEqual(studentOverviewJson.error.code, 'FORBIDDEN');
  console.log('✅ Student blocked with HTTP 403 Forbidden:', studentOverviewJson.error.message);

  // TEST 9.2: Student trying to access /api/admin/students -> MUST be 403 Forbidden
  console.log('\n--- Test 9.2: Student Access to /api/admin/students ---');
  const studentStudentsRes = await fetch(`${BASE_URL}/admin/students`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentStudentsRes.status, 403, `Student must receive 403, got ${studentStudentsRes.status}`);
  console.log('✅ Student blocked with HTTP 403 Forbidden from accessing student roster');

  // TEST 9.3: Unauthenticated access -> MUST be 401 Unauthorized
  console.log('\n--- Test 9.3: Unauthenticated Access ---');
  const unauthRes = await fetch(`${BASE_URL}/admin/overview`);
  assert.strictEqual(unauthRes.status, 401, `Unauthenticated request must receive 401, got ${unauthRes.status}`);
  console.log('✅ Unauthenticated request blocked with HTTP 401 Unauthorized');

  // TEST 9.4: Admin accessing /api/admin/overview -> MUST be 200 OK
  console.log('\n--- Test 9.4: Admin Access to /api/admin/overview ---');
  const adminOverviewRes = await fetch(`${BASE_URL}/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminOverviewRes.status, 200, `Admin must receive 200, got ${adminOverviewRes.status}`);
  const adminOverviewJson = await adminOverviewRes.json();
  assert.strictEqual(adminOverviewJson.success, true);
  assert.ok(adminOverviewJson.data.metrics.total_students >= 1, 'Total students metric must be >= 1');
  console.log('✅ Admin received 200 OK with Platform Metrics:', adminOverviewJson.data.metrics);
  console.log('✅ System Telemetry:', {
    database: adminOverviewJson.data.system.database,
    latency: `${adminOverviewJson.data.system.db_latency_ms}ms`
  });

  // TEST 9.5: Admin accessing /api/admin/students -> MUST be 200 OK
  console.log('\n--- Test 9.5: Admin Access to /api/admin/students ---');
  const adminStudentsRes = await fetch(`${BASE_URL}/admin/students?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminStudentsRes.status, 200, `Admin must receive 200, got ${adminStudentsRes.status}`);
  const adminStudentsJson = await adminStudentsRes.json();
  assert.strictEqual(adminStudentsJson.success, true);
  assert.ok(Array.isArray(adminStudentsJson.data.students), 'Students must be an array');
  assert.ok(adminStudentsJson.data.students.length > 0, 'Students array must not be empty');
  console.log(`✅ Admin retrieved ${adminStudentsJson.data.students.length} students from roster (Total: ${adminStudentsJson.data.pagination.total})`);

  console.log('\n========================================================');
  console.log('🎉 ALL PHASE 2 ADMIN API VERIFICATION TESTS PASSED (100%)');
  console.log('========================================================\n');
  process.exit(0);
}

testAdminApi().catch((err) => {
  console.error('❌ Phase 2 Verification Failed:', err);
  process.exit(1);
});
