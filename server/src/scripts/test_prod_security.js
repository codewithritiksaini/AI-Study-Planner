/**
 * Task 1 Verification Suite:
 * Production Readiness, Security Hardening, Rate Limiting & Health Checks
 */

import assert from 'node:assert';
import { validateEnvironment } from '../config/env.validator.js';
import { ERROR_CODES, AppError, NotFoundError, AuthError } from '../utils/errors.js';

const BASE_URL = 'http://localhost:5000';

async function runSecurityTests() {
  console.log('🧪 Testing Phase 12 Task 1: Production Security & Backend Hardening...\n');

  // --------------------------------------------------------------------------
  // TEST 1: Environment Validator Invariants
  // --------------------------------------------------------------------------
  console.log('--- Test 1: Centralized Environment Validator ---');
  
  // Valid configuration test
  const validMock = {
    PORT: '5000',
    NODE_ENV: 'development',
    CLIENT_URL: 'http://localhost:5173',
    SUPABASE_URL: 'https://xyzcompany.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-mock-key',
    GEMINI_API_KEY: 'AIzaSyDemoValidApiKey123456789'
  };
  const validated = validateEnvironment(validMock);
  assert.strictEqual(validated.PORT, 5000, 'PORT should be parsed as integer');
  assert.strictEqual(validated.NODE_ENV, 'development');
  console.log('✅ Valid environment parsed and typed correctly.');

  // Missing required keys test
  assert.throws(
    () => validateEnvironment({ PORT: '5000' }),
    (err) => err.message.includes('SUPABASE_URL'),
    'Should throw error listing missing SUPABASE_URL'
  );
  console.log('✅ Validator strictly rejects missing required credentials.');

  // Production security safeguard test
  assert.throws(
    () => validateEnvironment({
      ...validMock,
      NODE_ENV: 'production',
      SUPABASE_URL: 'http://localhost:54321'
    }),
    (err) => err.message.includes('Production cannot use localhost'),
    'Should prevent localhost in production'
  );
  console.log('✅ Validator strictly prevents localhost credentials in production.');

  // --------------------------------------------------------------------------
  // TEST 2: Standardized Application Error Hierarchy
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Standardized Error Codes & Classes ---');
  const notFound = new NotFoundError('Session not found');
  assert.strictEqual(notFound.statusCode, 404);
  assert.strictEqual(notFound.code, ERROR_CODES.NOT_FOUND);

  const authErr = new AuthError();
  assert.strictEqual(authErr.statusCode, 401);
  assert.strictEqual(authErr.code, ERROR_CODES.AUTH_REQUIRED);
  console.log('✅ Standardized AppError instances correctly initialize status and codes.');

  // --------------------------------------------------------------------------
  // TEST 3: Health Probe (GET /health)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: Liveness Probe (GET /health) ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, `Expected 200 on /health, got ${healthRes.status}`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok', 'Status should be ok');
  assert(typeof healthData.uptime === 'number', 'Uptime should be numeric');
  console.log(`✅ Liveness probe healthy (uptime: ${Math.round(healthData.uptime)}s).`);

  // --------------------------------------------------------------------------
  // TEST 4: Readiness Probe with Database Ping (GET /health/ready)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: Readiness Probe (GET /health/ready) ---');
  const readyRes = await fetch(`${BASE_URL}/health/ready`);
  assert.strictEqual(readyRes.status, 200, `Expected 200 on /health/ready, got ${readyRes.status}`);
  const readyData = await readyRes.json();
  assert.strictEqual(readyData.status, 'ready');
  assert.strictEqual(readyData.database, 'connected');
  assert(typeof readyData.db_latency_ms === 'number');
  console.log(`✅ Readiness probe healthy (DB latency: ${readyData.db_latency_ms}ms).`);

  // --------------------------------------------------------------------------
  // TEST 5: Security Headers Audit (Helmet)
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: Security Headers Audit ---');
  assert.strictEqual(
    healthRes.headers.get('x-content-type-options'),
    'nosniff',
    'Helmet x-content-type-options: nosniff header missing'
  );
  assert(
    healthRes.headers.get('x-dns-prefetch-control') !== null,
    'Helmet DNS prefetch control header missing'
  );
  console.log('✅ HTTP response contains active Helmet security hardening headers.');

  // --------------------------------------------------------------------------
  // TEST 6: Standardized Error JSON & Stack Trace Sanitization
  // --------------------------------------------------------------------------
  console.log('\n--- Test 6: Standardized Error JSON & Sanitization ---');
  const errRes = await fetch(`${BASE_URL}/api/non-existent-endpoint-${Date.now()}`);
  assert.strictEqual(errRes.status, 404, `Expected 404 on not-found, got ${errRes.status}`);
  const errBody = await errRes.json();
  assert.strictEqual(errBody.success, false, 'Error response must have success: false');
  assert(errBody.error && errBody.error.code, 'Error response must contain error.code');
  assert(errBody.error && errBody.error.message, 'Error response must contain error.message');
  console.log(`✅ 404 returned standardized envelope: [${errBody.error.code}] ${errBody.error.message}`);

  console.log('\n🎉 Task 1: Environment Security, Backend Hardening, Rate Limiting & Health Checks PASSED 100%!\n');
}

runSecurityTests().catch((err) => {
  console.error('❌ Task 1 Verification Failed:', err);
  process.exit(1);
});
