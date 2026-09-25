/**
 * test_scheduling_fallback.js
 *
 * Automated verification for Phase 11 Task 5:
 * 1. Deterministic session-level explanations
 * 2. Deterministic plan-level explanations (pure mode)
 * 3. Gemini AI coaching layer with safe fallback resilience
 */

import {
  generateSessionExplanation,
  generatePlanExplanation
} from '../services/planner/plan-explanation.service.js';

async function runExplanationFallbackTest() {
  console.log('🧪 Testing Phase 11: Plan Explainability & Gemini AI Fallback...\n');

  // --- Test 1: Deterministic Session Explanation ---
  console.log('--- Test 1: Session Explanation ---');
  const mockSession = {
    subject_name: 'Operating Systems',
    topic_name: 'CPU Scheduling Algorithms',
    duration_minutes: 45,
    start_time: '18:00',
    end_time: '18:45',
    days_until_exam: 3,
    task_source: 'RECOMMENDATION',
    is_locked: false
  };

  const sessionExp = generateSessionExplanation(mockSession);
  if (!sessionExp.summary || sessionExp.reason_bullets.length === 0) {
    throw new Error('Session explanation missing summary or reason bullets');
  }
  console.log('✅ Session explanation generated:');
  console.log(`   Summary: "${sessionExp.summary}"`);
  sessionExp.reason_bullets.forEach((b) => console.log(`   - ${b}`));

  // --- Test 2: Pure Deterministic Plan Explanation ---
  console.log('\n--- Test 2: Pure Deterministic Plan Explanation ---');
  const mockSchedule = {
    total_planned_minutes: 135,
    sessions: [mockSession, { ...mockSession, duration_minutes: 45 }, { ...mockSession, duration_minutes: 45 }],
    subject_distribution: { 'Operating Systems': 90, 'Database Systems': 45 },
    overloaded: false,
    unscheduled_tasks: []
  };

  const purePlanExp = await generatePlanExplanation(mockSchedule, {}, { useAI: false });
  if (purePlanExp.source !== 'DETERMINISTIC') {
    throw new Error(`Expected source DETERMINISTIC, got ${purePlanExp.source}`);
  }
  if (!purePlanExp.title || !purePlanExp.summary || purePlanExp.bullets.length === 0) {
    throw new Error('Deterministic plan explanation missing title, summary, or bullets');
  }
  console.log('✅ Deterministic plan explanation generated successfully:');
  console.log(`   Summary: "${purePlanExp.summary}"`);
  console.log(`   Source: ${purePlanExp.source}`);

  // --- Test 3: AI Coaching Layer & Fallback ---
  console.log('\n--- Test 3: AI Coaching Layer & Fallback ---');
  const aiPlanExp = await generatePlanExplanation(mockSchedule, {}, { useAI: true });
  if (!aiPlanExp.title || !aiPlanExp.summary || !aiPlanExp.source) {
    throw new Error('AI plan explanation missing envelope structure');
  }
  const validSources = ['AI_ENHANCED', 'DETERMINISTIC', 'DETERMINISTIC_FALLBACK'];
  if (!validSources.includes(aiPlanExp.source)) {
    throw new Error(`Unexpected source: ${aiPlanExp.source}`);
  }
  console.log('✅ AI generation/fallback executed gracefully:');
  console.log(`   Summary: "${aiPlanExp.summary}"`);
  console.log(`   Source: ${aiPlanExp.source}`);
  if (aiPlanExp.tips && aiPlanExp.tips.length > 0) {
    console.log(`   Tip: "${aiPlanExp.tips[0]}"`);
  }

  console.log('\n🎉 Plan Explainability & Gemini AI Fallback PASSED 100%!\n');
}

runExplanationFallbackTest().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Explanation fallback test failed:', err);
  process.exit(1);
});
