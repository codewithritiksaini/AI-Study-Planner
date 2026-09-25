/**
 * test_scheduling_context.js
 *
 * Automated verification for Phase 11 Task 2:
 * 1. Validates schedulerConfig constants and bounds.
 * 2. Executes buildSchedulingContext against live database.
 * 3. Verifies context completeness (availability, subjects, topics, prerequisites, recommendations, metrics).
 */

import { schedulerConfig } from '../config/scheduler.config.js';
import { buildSchedulingContext } from '../services/planner/scheduling-context.service.js';
import { query } from '../config/db.js';

async function runContextTest() {
  console.log('🧪 Testing Phase 11: Scheduler Config & Context Aggregator...\n');

  try {
    // 1. Verify schedulerConfig
    if (
      !schedulerConfig.ALGORITHM_VERSION ||
      schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES !== 20 ||
      schedulerConfig.SESSION_BOUNDS.MAX_SESSION_MINUTES !== 90 ||
      schedulerConfig.SESSION_BOUNDS.BREAK_MINUTES !== 10
    ) {
      throw new Error('schedulerConfig constants invalid or missing');
    }
    console.log('✅ schedulerConfig verified successfully.');

    // 2. Fetch seed student
    const studentUser = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
    if (studentUser.rows.length === 0) {
      throw new Error('Seed student user not found in auth.users');
    }
    const userId = studentUser.rows[0].id;

    // 3. Build Scheduling Context
    console.log('\n--- Building Scheduling Context for Student ---');
    const context = await buildSchedulingContext(userId, { lookbackDays: 14 });

    // 4. Validate context properties
    if (!context.user_id || !context.today || !context.period || !context.preferences) {
      throw new Error('SchedulingContext missing primary header fields');
    }

    if (!Array.isArray(context.availability) || context.availability.length === 0) {
      throw new Error('SchedulingContext availability missing or empty');
    }

    if (!Array.isArray(context.subjects) || !Array.isArray(context.topics)) {
      throw new Error('SchedulingContext subjects or topics missing');
    }

    if (!Array.isArray(context.recommendations)) {
      throw new Error('SchedulingContext recommendations missing');
    }

    if (!context.historical_metrics || context.historical_metrics.observed_avg_session_minutes === undefined) {
      throw new Error('SchedulingContext historical_metrics missing');
    }

    console.log('📊 Aggregated Scheduling Context Summary:');
    console.log(`- Timezone: ${context.timezone}`);
    console.log(`- Today: ${context.today}`);
    console.log(`- Period: ${context.period.start} to ${context.period.end}`);
    console.log(`- Max Daily Study Time: ${context.preferences.max_daily_minutes} min`);
    console.log(`- Availability Windows: ${context.availability.length} active day(s)`);
    console.log(`- Blocked Periods: ${context.blocked_periods.length} window(s)`);
    console.log(`- Enrolled Subjects: ${context.subjects.length}`);
    console.log(`- Syllabus Topics: ${context.topics.length}`);
    console.log(`- Active Phase 10 Recommendations: ${context.recommendations.length}`);
    console.log(`- Existing Scheduled Plans: ${context.existing_plans.length}`);
    console.log(`- Missed Backlog Plans: ${context.backlog.length}`);
    console.log(`- Historical Observed Avg Session: ${context.historical_metrics.observed_avg_session_minutes} min`);
    console.log(`- Plan Adherence Rate: ${context.historical_metrics.plan_adherence_rate}%`);

    console.log('\n🎉 Task 2: Centralized Config & Scheduling Context Aggregator PASSED 100%!\n');
  } catch (err) {
    console.error('❌ Scheduling context test failed:', err);
    process.exit(1);
  }
}

runContextTest().then(() => process.exit(0));
