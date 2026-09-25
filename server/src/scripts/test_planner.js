import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  calculateExamUrgency,
  calculateCompletionNeed,
  calculateDifficultyScore,
  calculateInactivityScore,
  calculatePriorityScore,
  generateReason
} from '../services/priority.service.js';
import {
  calculateAvailableMinutes,
  allocateTasks,
  createTimeSlots,
  validateSchedule
} from '../services/scheduling.service.js';
import { plannerService } from '../services/planner.service.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = pg;

async function runPlannerVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 PHASE 5: RULE-BASED STUDY PLANNER VERIFICATION SUITE');
  console.log('================================================================\n');

  // ============================================================================
  // UNIT TEST 1: Pure Priority Mathematical Determinism
  // ============================================================================
  console.log('▶️ [Test 1] Priority Scoring Determinism & Explainability');

  const today = '2026-09-25';

  // Urgency: Closer exam must produce higher urgency score
  const urgency1Day = calculateExamUrgency('2026-09-26', today);
  const urgency7Days = calculateExamUrgency('2026-10-02', today);
  const urgency30Days = calculateExamUrgency('2026-10-25', today);
  const urgencyNoExam = calculateExamUrgency(null, today);
  const urgencyPastExam = calculateExamUrgency('2026-09-20', today);

  if (!(urgency1Day > urgency7Days && urgency7Days > urgency30Days && urgency30Days > urgencyPastExam)) {
    throw new Error(`Exam urgency ordering failed: 1d=${urgency1Day}, 7d=${urgency7Days}, 30d=${urgency30Days}, past=${urgencyPastExam}`);
  }
  console.log(`  ✓ Exam urgency scales monotonically: 1d (${urgency1Day}) > 7d (${urgency7Days}) > 30d (${urgency30Days}) > past (${urgencyPastExam})`);

  // Completion Need: Incomplete topic must yield higher score than mostly completed
  const need0 = calculateCompletionNeed(0);
  const need50 = calculateCompletionNeed(50);
  const need90 = calculateCompletionNeed(90);
  if (!(need0 > need50 && need50 > need90)) {
    throw new Error(`Completion need ordering failed: 0%=${need0}, 50%=${need50}, 90%=${need90}`);
  }
  console.log(`  ✓ Completion need scales monotonically: 0% (${need0}) > 50% (${need50}) > 90% (${need90})`);

  // Difficulty: HARD > MEDIUM > EASY
  const diffHard = calculateDifficultyScore('HARD');
  const diffMed = calculateDifficultyScore('MEDIUM');
  const diffEasy = calculateDifficultyScore('EASY');
  if (!(diffHard > diffMed && diffMed > diffEasy)) {
    throw new Error('Difficulty scoring failed');
  }
  console.log(`  ✓ Difficulty score ordering: HARD (${diffHard}) > MEDIUM (${diffMed}) > EASY (${diffEasy})`);

  // Inactivity: Never studied > 5 days ago > studied today
  const inactNever = calculateInactivityScore(null, today);
  const inact5d = calculateInactivityScore('2026-09-20', today);
  const inactToday = calculateInactivityScore('2026-09-25T08:00:00Z', today);
  if (!(inactNever > inact5d && inact5d > inactToday)) {
    throw new Error('Inactivity scoring failed');
  }
  console.log(`  ✓ Inactivity score ordering: Never (${inactNever}) > 5d (${inact5d}) > Today (${inactToday})`);

  // Explainable Reason Generation
  const reason = generateReason({
    urgency: urgency1Day,
    completionNeed: need0,
    difficulty: diffHard,
    inactivity: inactNever,
    subjectName: 'DBMS',
    topicName: 'Transactions',
    examDateStr: '2026-09-26',
    planningDateStr: today
  });
  if (!reason.includes('DBMS exam') || !reason.includes('complete')) {
    throw new Error(`Reason generation failed: ${reason}`);
  }
  console.log(`  ✓ Deterministic reason generated: "${reason}"`);

  // ============================================================================
  // UNIT TEST 2: Capacity Budgeting & Overlap Prevention
  // ============================================================================
  console.log('\n▶️ [Test 2] Capacity Budgeting & Scheduling Constraints');

  const profile = {
    daily_available_hours: 2,
    preferred_study_start_time: '18:00',
    preferred_study_end_time: '20:30'
  };

  const availableMinutes = calculateAvailableMinutes(profile);
  if (availableMinutes !== 120) {
    throw new Error(`Expected available minutes to be 120, got ${availableMinutes}`);
  }
  console.log(`  ✓ Available study minutes correctly calculated: ${availableMinutes} mins`);

  const mockCandidates = [
    { subject_id: 'sub-1', topic_id: 'top-1', estimated_minutes: 60, completion_percentage: 0, priority_score: 0.90, reason: 'High' },
    { subject_id: 'sub-2', topic_id: 'top-2', estimated_minutes: 60, completion_percentage: 0, priority_score: 0.85, reason: 'Med' },
    { subject_id: 'sub-3', topic_id: 'top-3', estimated_minutes: 60, completion_percentage: 0, priority_score: 0.70, reason: 'Low' }
  ];

  const allocated = allocateTasks(mockCandidates, availableMinutes);
  const totalAllocatedMinutes = allocated.reduce((sum, t) => sum + t.planned_minutes, 0);

  if (totalAllocatedMinutes > availableMinutes) {
    throw new Error(`OVERSCHEDULING DETECTED: ${totalAllocatedMinutes}m > ${availableMinutes}m capacity`);
  }
  if (allocated.length !== 2) {
    throw new Error(`Expected exactly 2 tasks to fit into 120m, got ${allocated.length}`);
  }
  console.log(`  ✓ Strict capacity respected: allocated ${totalAllocatedMinutes}m across ${allocated.length} tasks without overscheduling.`);

  // Create time slots with breaks
  const scheduled = createTimeSlots(allocated, today, profile);
  const validation = validateSchedule(scheduled, availableMinutes);
  if (!validation.valid) {
    throw new Error(`Schedule validation failed: ${validation.error}`);
  }
  console.log('  ✓ Generated time slots verified: zero overlaps, start < end, 10m break inserted.');

  // ============================================================================
  // DATABASE INTEGRATION & RLS VERIFICATION
  // ============================================================================
  console.log('\n▶️ [Test 3] End-to-End Database Integration & Row Level Security (RLS)');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const userA_id = '77777777-7777-4777-8777-777777777777';
  const userB_id = '88888888-8888-4888-8888-888888888888';

  try {
    // 0. Cleanup any old test records
    await client.query(`DELETE FROM public.study_plans WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.study_sessions WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);

    // 1. Insert two test accounts
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a_phase5@test.com', '{"full_name": "Student A Phase 5"}', 'authenticated', 'authenticated'),
        ($2, 'student_b_phase5@test.com', '{"full_name": "Student B Phase 5"}', 'authenticated', 'authenticated');
    `, [userA_id, userB_id]);

    await client.query(`
      UPDATE public.profiles
      SET daily_available_hours = 3,
          preferred_study_start_time = '18:00',
          preferred_study_end_time = '22:00'
      WHERE id = $1;
    `, [userA_id]);

    await client.query(`
      UPDATE public.profiles
      SET daily_available_hours = 2,
          preferred_study_start_time = '19:00',
          preferred_study_end_time = '21:00'
      WHERE id = $1;
    `, [userB_id]);

    // User A subjects: DBMS (exam in 4 days) & OS (exam in 25 days)
    const subA1 = await client.query(`
      INSERT INTO public.subjects (user_id, name, exam_date, color)
      VALUES ($1, 'DBMS', '2026-09-29', '#4f46e5') RETURNING id;
    `, [userA_id]);
    const dbmsId = subA1.rows[0].id;

    const subA2 = await client.query(`
      INSERT INTO public.subjects (user_id, name, exam_date, color)
      VALUES ($1, 'Operating Systems', '2026-10-20', '#059669') RETURNING id;
    `, [userA_id]);
    const osId = subA2.rows[0].id;

    // User A topics
    const topA1 = await client.query(`
      INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
      VALUES ($1, 'Normalization', 'HARD', 60, 20, 'IN_PROGRESS') RETURNING id;
    `, [dbmsId]);
    const normId = topA1.rows[0].id;

    const topA2 = await client.query(`
      INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
      VALUES ($1, 'CPU Scheduling', 'MEDIUM', 60, 50, 'IN_PROGRESS') RETURNING id;
    `, [osId]);
    const schedId = topA2.rows[0].id;

    // Completed topic should be EXCLUDED
    await client.query(`
      INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
      VALUES ($1, 'Relational Algebra', 'EASY', 60, 100, 'COMPLETED');
    `, [dbmsId]);

    console.log('  ✓ Seeded User A curriculum with urgent DBMS and less urgent OS.');

    // 2. Generate Plan for User A via plannerService
    const genPlan = await plannerService.generatePlan(userA_id, { date: today });
    if (!genPlan.plans || genPlan.plans.length === 0) {
      throw new Error('Plan generation failed: no plans returned');
    }

    // Verify ordering: DBMS Normalization should rank 1st because exam is in 4 days and it is HARD
    const firstPlan = genPlan.plans[0];
    if (firstPlan.topic_id !== normId) {
      throw new Error(`Expected first plan to be Normalization, got topic_id: ${firstPlan.topic_id}`);
    }
    console.log(`  ✓ Plan generated successfully: 1st task is "${firstPlan.topics?.name}" (Priority: ${(firstPlan.priority_score * 100).toFixed(0)}%)`);

    // Verify completed topic was excluded
    const hasCompletedTopic = genPlan.plans.some(p => p.topics?.name === 'Relational Algebra');
    if (hasCompletedTopic) {
      throw new Error('Completed topic was incorrectly included in study plan');
    }
    console.log('  ✓ Completed topics correctly excluded from schedule.');

    // 3. Verify Safe Regeneration (Preserve COMPLETED / IN_PROGRESS)
    console.log('\n▶️ [Test 4] Safe Regeneration & Plan Persistence');

    // Mark the first plan as COMPLETED
    await plannerService.updatePlanStatus(userA_id, firstPlan.id, PLANNER_CONFIG.statuses.COMPLETED);

    // Call generatePlan with forceRegenerate = true
    const regenPlan = await plannerService.generatePlan(userA_id, { date: today, forceRegenerate: true });

    // Verify the completed plan is STILL in the schedule and was NOT deleted
    const preserved = regenPlan.plans.find(p => p.id === firstPlan.id);
    if (!preserved || preserved.status !== PLANNER_CONFIG.statuses.COMPLETED) {
      throw new Error('COMPLETED plan was not safely preserved during plan regeneration');
    }
    console.log('  ✓ Safe Regeneration Verified: COMPLETED plan preserved; pending slots re-budgeted.');

    // 4. Verify Cross-User Isolation (RLS Security)
    console.log('\n▶️ [Test 5] Cross-User RLS Isolation');

    await client.query(`BEGIN;`);
    await client.query(`SET LOCAL ROLE authenticated;`);
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true);`, [userB_id]);

    const userB_view_plans = await client.query(`SELECT * FROM public.study_plans;`);
    if (userB_view_plans.rows.length !== 0) {
      throw new Error(`RLS LEAK DETECTED: User B saw ${userB_view_plans.rows.length} plans of User A`);
    }
    console.log('  ✓ User B query to public.study_plans returned 0 rows (RLS SELECT verified).');

    // As authenticated User B: cannot delete User A's plan
    const userB_delete = await client.query(`DELETE FROM public.study_plans WHERE id = $1;`, [firstPlan.id]);
    if (userB_delete.rowCount > 0) {
      throw new Error('RLS BREACH: User B deleted User A study plan');
    }
    console.log('  ✓ User B cannot delete User A study plan (RLS DELETE verified).');

    // As authenticated User B: cannot update User A's plan status
    const userB_update = await client.query(`UPDATE public.study_plans SET status = 'SKIPPED' WHERE id = $1;`, [firstPlan.id]);
    if (userB_update.rowCount > 0) {
      throw new Error('RLS BREACH: User B updated User A study plan');
    }
    console.log('  ✓ User B cannot update User A study plan (RLS UPDATE verified).');

    await client.query(`COMMIT;`);

    // Clean up test data
    await client.query(`DELETE FROM public.study_plans WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA_id, userB_id]);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA_id, userB_id]);

    console.log('\n================================================================');
    console.log('🎉 ALL 5 PLANNER VERIFICATION TESTS PASSED (100% SUCCESS)');
    console.log('================================================================');
  } finally {
    await client.end();
  }
}

runPlannerVerificationSuite().catch((err) => {
  console.error('\n❌ PLANNER VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
