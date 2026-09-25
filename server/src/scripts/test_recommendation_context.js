import { query } from '../config/db.js';
import { recommendationConfig } from '../config/recommendation.config.js';
import { buildRecommendationContext } from '../services/recommendations/recommendation-context.service.js';

async function testRecommendationContext() {
  console.log('🧪 Testing Phase 10: Recommendation Config & Context Aggregator...');

  try {
    // 1. Verify config
    if (!recommendationConfig.TYPES.WEAK_TOPIC || !recommendationConfig.TYPES.EXAM_PREPARATION) {
      throw new Error('Config TYPES is missing required recommendation types');
    }
    if (recommendationConfig.SCORING_WEIGHTS.EXAM_FACTOR_MAX !== 40) {
      throw new Error('Config SCORING_WEIGHTS.EXAM_FACTOR_MAX should be 40');
    }
    console.log('✅ recommendationConfig verified successfully.');

    // 2. Lookup test student user
    const userRes = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
    if (userRes.rows.length === 0) {
      throw new Error('Test student user not found in auth.users');
    }
    const userId = userRes.rows[0].id;

    // 3. Build recommendation context
    const context = await buildRecommendationContext(userId);

    // 4. Assert context structure
    if (!context.userId || context.userId !== userId) {
      throw new Error('Context userId mismatch');
    }
    if (!context.todayStr || !context.timezone) {
      throw new Error('Context missing todayStr or timezone');
    }
    if (!Array.isArray(context.subjects)) {
      throw new Error('Context subjects is not an array');
    }
    if (!Array.isArray(context.topics)) {
      throw new Error('Context topics is not an array');
    }
    if (typeof context.averageSessionMinutes !== 'number' || context.averageSessionMinutes <= 0) {
      throw new Error('Context averageSessionMinutes must be a positive number');
    }
    if (!context.metrics || !context.metrics.study || !context.metrics.quiz || !context.metrics.planner) {
      throw new Error('Context missing nested Phase 9 metrics');
    }

    console.log('\n📊 Aggregated Context Summary:');
    console.log(`- Timezone: ${context.timezone}`);
    console.log(`- Today: ${context.todayStr}`);
    console.log(`- Subjects: ${context.subjects.length}`);
    console.log(`- Topics: ${context.topics.length}`);
    console.log(`- Exam Urgent Subjects: ${context.examUrgentSubjects.length}`);
    console.log(`- Backlog Tasks: ${context.backlogTasks.length}`);
    console.log(`- Average Session Minutes: ${context.averageSessionMinutes} min`);
    console.log(`- Study Consistency: ${context.metrics.study.consistency_percentage}%`);
    console.log(`- Plan Adherence: ${context.metrics.planner.adherence_percentage}%`);

    console.log('\n🎉 Task 2: Centralized Config & Context Aggregator PASSED 100%!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Task 2 Test failed:', err.stack || err);
    process.exit(1);
  }
}

testRecommendationContext();
