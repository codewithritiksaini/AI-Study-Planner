/**
 * test_e2e_journey.js
 *
 * Comprehensive End-to-End User Journey Test for AI Study Planner:
 * 1. Health & Readiness checks (GET /health, GET /health/ready).
 * 2. Student Authentication (POST /api/auth/login).
 * 3. Curriculum Retrieval (GET /api/subjects & GET /api/topics/subject/:id).
 * 4. Analytics & Mastery Inspection (GET /api/analytics/dashboard).
 * 5. Adaptive Recommendation Ingestion (GET /api/recommendations).
 * 6. Scheduling Horizon:
 *    - Fetch Daily Plan (GET /api/planner/daily).
 *    - Fetch Weekly Timetable (GET /api/planner/weekly).
 *    - Generate Schedule Optimization Preview (POST /api/planner/preview).
 *    - Apply Schedule (POST /api/planner/apply).
 *    - Create Manual Study Task (POST /api/planner/sessions).
 *    - Toggle Session Lock Protection (POST /api/planner/sessions/:id/lock).
 *    - Reschedule Missed Session (POST /api/planner/sessions/:id/reschedule).
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runE2EJourney() {
  console.log('🚀 Starting Full E2E User Journey Verification...\n');

  try {
    // --------------------------------------------------------------------------
    // Step 1: Health Probes
    // --------------------------------------------------------------------------
    console.log('--- Step 1: Health & Readiness Probes ---');
    const liveness = await makeRequest('GET', '/health');
    if (liveness.status !== 200 || !liveness.data.status) {
      throw new Error(`Liveness check failed with status ${liveness.status}`);
    }
    console.log(`  ✅ Liveness probe passed (status: ${liveness.data.status}, uptime: ${liveness.data.uptime}s)`);

    const readiness = await makeRequest('GET', '/health/ready');
    if (readiness.status !== 200 || readiness.data.database !== 'connected') {
      throw new Error(`Readiness check failed with status ${readiness.status}`);
    }
    console.log(`  ✅ Readiness probe passed (database: ${readiness.data.database}, latency: ${readiness.data.latency_ms || 0}ms)`);

    // --------------------------------------------------------------------------
    // Step 2: Student Authentication
    // --------------------------------------------------------------------------
    console.log('\n--- Step 2: Student Authentication (POST /api/auth/login) ---');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'student@gmail.com',
      password: 'Student@123'
    });

    if (loginRes.status !== 200 || !loginRes.data?.session?.access_token) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.session.access_token;
    const userId = loginRes.data.user.id;
    console.log(`  ✅ Authenticated as ${loginRes.data.user.email} (ID: ${userId})`);

    // --------------------------------------------------------------------------
    // Step 3: Curriculum & Topics Retrieval
    // --------------------------------------------------------------------------
    console.log('\n--- Step 3: Enrolled Subjects & Syllabus Retrieval ---');
    const subjectsRes = await makeRequest('GET', '/api/subjects', null, token);
    const subjects = subjectsRes.data?.data?.subjects || subjectsRes.data?.data || [];
    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new Error(`Subjects retrieval failed: ${JSON.stringify(subjectsRes.data)}`);
    }

    console.log(`  ✅ Retrieved ${subjects.length} enrolled subjects:`);
    subjects.forEach(s => console.log(`     - [${s.code || 'CORE'}] ${s.name} (Exam: ${s.exam_date || 'N/A'})`));

    const firstSubject = subjects[0];
    const topicsRes = await makeRequest('GET', `/api/subjects/${firstSubject.id}/topics`, null, token);
    const topics = topicsRes.data?.data?.topics || topicsRes.data?.data || [];
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error(`Topics retrieval failed: ${JSON.stringify(topicsRes.data)}`);
    }
    console.log(`  ✅ Retrieved ${topics.length} topics for ${firstSubject.name}.`);

    // --------------------------------------------------------------------------
    // Step 4: Analytics & Mastery Inspection
    // --------------------------------------------------------------------------
    console.log('\n--- Step 4: Academic Analytics & Mastery Dashboard ---');
    const analyticsRes = await makeRequest('GET', '/api/analytics/overview', null, token);
    if (analyticsRes.status !== 200 || !analyticsRes.data?.success) {
      throw new Error(`Analytics retrieval failed: ${JSON.stringify(analyticsRes.data)}`);
    }
    const metrics = analyticsRes.data.data;
    console.log(`  ✅ Overview analytics retrieved successfully.`);

    // --------------------------------------------------------------------------
    // Step 5: Adaptive Recommendations
    // --------------------------------------------------------------------------
    console.log('\n--- Step 5: High-Priority Recommendations Ingestion ---');
    const recsRes = await makeRequest('GET', '/api/recommendations', null, token);
    const recommendations = recsRes.data?.recommendations || recsRes.data?.data || [];
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error(`Recommendations retrieval failed: ${JSON.stringify(recsRes.data)}`);
    }
    console.log(`  ✅ Ingested ${recommendations.length} active recommendation(s):`);
    recommendations.forEach(r => console.log(`     - [Score ${r.priority_score}] ${r.title}`));

    // --------------------------------------------------------------------------
    // Step 6: Intelligent Scheduling Horizon Workflow
    // --------------------------------------------------------------------------
    console.log('\n--- Step 6: Intelligent Scheduling Horizon Workflow ---');
    // A. Daily plan
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyRes = await makeRequest('GET', `/api/planner/daily?date=${todayStr}`, null, token);
    if (dailyRes.status !== 200 || !dailyRes.data?.data) {
      throw new Error(`Daily schedule retrieval failed: ${JSON.stringify(dailyRes.data)}`);
    }
    console.log(`  ✅ Daily schedule retrieved (Available: ${dailyRes.data.data.capacity?.available_minutes || 0}m, Planned: ${dailyRes.data.data.capacity?.planned_minutes || 0}m, Sessions: ${dailyRes.data.data.sessions?.length || 0})`);

    // B. Weekly timetable
    const weeklyRes = await makeRequest('GET', `/api/planner/weekly?startDate=${todayStr}`, null, token);
    if (weeklyRes.status !== 200 || !weeklyRes.data?.data?.days) {
      throw new Error(`Weekly timetable retrieval failed: ${JSON.stringify(weeklyRes.data)}`);
    }
    console.log(`  ✅ 7-Day timetable horizon retrieved (${weeklyRes.data.data.days.length} days projected).`);

    // C. Schedule preview generation
    console.log('  Generating non-destructive optimization preview...');
    const previewRes = await makeRequest('POST', '/api/planner/preview', {
      start_date: todayStr,
      days: 7,
      preferred_session_minutes: 45,
      max_daily_minutes: 180
    }, token);

    if (previewRes.status !== 200 || !previewRes.data?.data?.generation_id) {
      throw new Error(`Preview generation failed: ${JSON.stringify(previewRes.data)}`);
    }
    const generationId = previewRes.data.data.generation_id;
    const scheduledCount = previewRes.data.data.scheduled_sessions?.length || 0;
    console.log(`  ✅ Optimization preview generated (Generation ID: ${generationId}, ${scheduledCount} sessions calculated).`);

    // D. Apply schedule
    console.log('  Applying generated schedule to active student calendar...');
    const applyRes = await makeRequest('POST', '/api/planner/apply', {
      generation_id: generationId,
      preserve_locked: true
    }, token);

    if (applyRes.status !== 200 || !applyRes.data?.success) {
      throw new Error(`Apply plan failed: ${JSON.stringify(applyRes.data)}`);
    }
    console.log(`  ✅ Plan applied successfully (${applyRes.data.data?.sessions_created || 0} sessions written).`);

    // E. Manual session creation
    console.log('  Creating manual custom study task...');
    const targetTopic = topics[0];
    const manualRes = await makeRequest('POST', '/api/planner/sessions', {
      subject_id: firstSubject.id,
      topic_id: targetTopic.id,
      date: todayStr,
      planned_minutes: 45,
      start_time: '20:30',
      end_time: '21:15',
      custom_title: 'Manual End-of-Day Code Review',
      is_locked: true
    }, token);

    if (manualRes.status !== 201 || !manualRes.data?.data?.session?.id) {
      throw new Error(`Manual session creation failed: ${JSON.stringify(manualRes.data)}`);
    }
    const manualSessionId = manualRes.data.data.session.id;
    console.log(`  ✅ Manual session created (ID: ${manualSessionId}, locked: ${manualRes.data.data.session.is_locked})`);

    // F. Lock toggle
    console.log('  Toggling session lock protection...');
    const toggleRes = await makeRequest('POST', `/api/planner/sessions/${manualSessionId}/lock`, {}, token);

    if (toggleRes.status !== 200 || toggleRes.data?.data?.is_locked !== false) {
      throw new Error(`Lock toggle failed: ${JSON.stringify(toggleRes.data)}`);
    }
    console.log(`  ✅ Lock status toggled to: ${toggleRes.data.data.is_locked}`);

    // G. Reschedule session
    console.log('  Testing adaptive missed session rescheduling...');
    const rescheduleRes = await makeRequest('POST', `/api/planner/sessions/${manualSessionId}/reschedule`, {}, token);

    if (rescheduleRes.status !== 200) {
      throw new Error(`Reschedule failed: ${JSON.stringify(rescheduleRes.data)}`);
    }
    if (rescheduleRes.data?.data?.rescheduled_session) {
      const rescheduled = rescheduleRes.data.data.rescheduled_session;
      console.log(`  ✅ Session rescheduled to: ${rescheduled.plan_date} (${rescheduled.start_time})`);
    } else if (rescheduleRes.data?.data?.status === 'UNSCHEDULED') {
      console.log(`  ✅ Adaptive scheduler safely detected capacity saturation: ${rescheduleRes.data.data.message}`);
    } else {
      throw new Error(`Unexpected reschedule response: ${JSON.stringify(rescheduleRes.data)}`);
    }

    console.log('\n🎉 ALL E2E User Journey Verification Steps PASSED 100%!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E Journey Test FAILED:', err.message);
    process.exit(1);
  }
}

runE2EJourney();
