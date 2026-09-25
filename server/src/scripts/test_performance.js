import { query } from '../config/db.js';
import { performanceService } from '../services/performance.service.js';

async function runPerformanceTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 PHASE 7: TOPIC PERFORMANCE & WEAK/STRONG TOPIC DETECTION SUITE');
  console.log('================================================================\n');

  const userA = '99999999-9999-4999-8999-999999999999';
  const userB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  try {
    // 0. Cleanup stale test records
    await query(`DELETE FROM public.topic_performance WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_answers WHERE attempt_id IN (SELECT id FROM public.quiz_attempts WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quiz_attempts WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quizzes WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA, userB]);

    // 1. Seed auth users & test subject
    await query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a_perf@test.com', '{"full_name": "Student A Perf"}', 'authenticated', 'authenticated'),
        ($2, 'student_b_perf@test.com', '{"full_name": "Student B Perf"}', 'authenticated', 'authenticated');
    `, [userA, userB]);

    const subjRes = await query(
      `INSERT INTO public.subjects (user_id, name, exam_date, target_score, color)
       VALUES ($1, 'Performance Testing Subject', (now() + interval '14 days')::date, 95, '#10B981')
       RETURNING id;`,
      [userA]
    );
    const subjectId = subjRes.rows[0].id;

    // Create 2 topics: Topic 1 (Syllabus 100% complete) and Topic 2 (Syllabus 30% complete)
    const t1Res = await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, status, completion_percentage)
       VALUES ($1, 'Normalization Mastery Topic', 'HARD', 90, 'COMPLETED', 100.0)
       RETURNING id, name, completion_percentage;`,
      [subjectId]
    );
    const topic1Id = t1Res.rows[0].id;

    const t2Res = await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, status, completion_percentage)
       VALUES ($1, 'Transactions Concurrency Topic', 'MEDIUM', 60, 'IN_PROGRESS', 30.0)
       RETURNING id, name;`,
      [subjectId]
    );
    const topic2Id = t2Res.rows[0].id;

    console.log('✅ Base test fixtures created for User A.\n');

    // Create test quiz for Topic 1
    const qRes = await query(
      `INSERT INTO public.quizzes (user_id, subject_id, topic_id, title, difficulty, question_count, source)
       VALUES ($1, $2, $3, 'Performance Benchmark Quiz', 'HARD', 5, 'AI')
       RETURNING id;`,
      [userA, subjectId, topic1Id]
    );
    const quizId = qRes.rows[0].id;

    // Helper to simulate a completed attempt
    let attemptCounter = 0;
    const createAttempt = async (percentage, correctCount, totalQuestions) => {
      attemptCounter++;
      const res = await query(
        `INSERT INTO public.quiz_attempts (
            quiz_id, user_id, status, percentage, score, max_score, 
            correct_count, incorrect_count, unanswered_count, submitted_at
         ) VALUES ($1, $2, 'COMPLETED', $3, $4, $5, $6, $7, 0, now() + interval '${attemptCounter} minutes')
         RETURNING id;`,
        [quizId, userA, percentage, correctCount, totalQuestions, correctCount, totalQuestions - correctCount]
      );
      return res.rows[0].id;
    };

    // ▶️ [Test 1] Initial Quiz Attempt (Score: 40%) -> Classified as WEAK
    console.log('▶️ [Test 1] Single Attempt Performance & Classification');
    await createAttempt(40.0, 4, 10);
    const perf1 = await performanceService.updateTopicPerformance(userA, topic1Id);

    console.log(`  ✓ Attempt 1 (40%): Average: ${perf1.average_percentage}%, Level: ${perf1.performance_level}`);
    if (perf1.performance_level !== 'WEAK' || perf1.attempt_count !== 1) {
      throw new Error(`Expected WEAK level on 40% attempt, got ${perf1.performance_level}`);
    }

    // ▶️ [Test 2] Separation Between Completion & Mastery
    console.log('\n▶️ [Test 2] Principle: Syllabus Completion (100%) != Topic Mastery (WEAK)');
    const topic1Details = await performanceService.getTopicPerformanceById(userA, topic1Id);
    console.log(`  ✓ Topic "${topic1Details.topic_name}": Completion: ${topic1Details.completion_percentage}%, Quiz Accuracy: ${topic1Details.average_percentage}%, Level: ${topic1Details.performance_level}`);
    if (Number(topic1Details.completion_percentage) !== 100 || topic1Details.performance_level !== 'WEAK') {
      throw new Error('Syllabus completion confused with quiz mastery!');
    }
    console.log('  ✓ Verified: 100% syllabus completion does not falsely mask weak quiz performance.');

    // ▶️ [Test 3] Multi-Attempt Weighted Progression ($0.60 recent + $0.40 historical)
    console.log('\n▶️ [Test 3] Mathematical Progression & Recent vs Historical Weighting');
    
    // Attempt 2: 70% -> Recent: 70%, Average: 55% -> Level: NEEDS_PRACTICE
    await createAttempt(70.0, 7, 10);
    const perf2 = await performanceService.updateTopicPerformance(userA, topic1Id);
    console.log(`  ✓ Attempt 2 (70%): Recent: ${perf2.recent_percentage}%, Average: ${perf2.average_percentage}%, Level: ${perf2.performance_level}`);
    if (perf2.performance_level !== 'NEEDS_PRACTICE') {
      throw new Error(`Expected NEEDS_PRACTICE after 70% attempt, got ${perf2.performance_level}`);
    }

    // Attempt 3: 90%
    await createAttempt(90.0, 9, 10);
    const perf3 = await performanceService.updateTopicPerformance(userA, topic1Id);
    console.log(`  ✓ Attempt 3 (90%): Recent: ${perf3.recent_percentage}%, Average: ${perf3.average_percentage}%, Level: ${perf3.performance_level}`);

    // Attempt 4: 95% -> Recent (95, 90, 70) = 85%, Average = 73.75%, Weighted = 80.5% -> AVERAGE
    await createAttempt(95.0, 19, 20);
    const perf4 = await performanceService.updateTopicPerformance(userA, topic1Id);
    console.log(`  ✓ Attempt 4 (95%): Recent: ${perf4.recent_percentage}%, Average: ${perf4.average_percentage}%, Level: ${perf4.performance_level}`);
    if (perf4.performance_level !== 'AVERAGE') {
      throw new Error(`Expected AVERAGE after 4th high attempt, got ${perf4.performance_level}`);
    }

    // Attempt 5: 100% -> Recent (100, 95, 90) = 95%, Average = 79%, Weighted = 88.6% -> STRONG
    await createAttempt(100.0, 10, 10);
    const perf5 = await performanceService.updateTopicPerformance(userA, topic1Id);
    console.log(`  ✓ Attempt 5 (100%): Recent: ${perf5.recent_percentage}%, Average: ${perf5.average_percentage}%, Level: ${perf5.performance_level}`);
    if (perf5.performance_level !== 'STRONG') {
      throw new Error(`Expected STRONG after sustained mastery, got ${perf5.performance_level}`);
    }

    // ▶️ [Test 4] Weak vs Strong Topics Detection
    console.log('\n▶️ [Test 4] Weak & Strong Topic Filtering');
    
    // Seed Topic 2 with a low score attempt so User A has both weak and strong topics
    const q2Res = await query(
      `INSERT INTO public.quizzes (user_id, subject_id, topic_id, title, difficulty, question_count, source)
       VALUES ($1, $2, $3, 'Transactions Quiz', 'MEDIUM', 5, 'AI')
       RETURNING id;`,
      [userA, subjectId, topic2Id]
    );
    await query(
      `INSERT INTO public.quiz_attempts (quiz_id, user_id, status, percentage, score, max_score, correct_count, incorrect_count, unanswered_count, submitted_at)
       VALUES ($1, $2, 'COMPLETED', 45.0, 2, 5, 2, 3, 0, now());`,
      [q2Res.rows[0].id, userA]
    );
    await performanceService.updateTopicPerformance(userA, topic2Id);

    const weakTopics = await performanceService.getWeakTopics(userA);
    const strongTopics = await performanceService.getStrongTopics(userA);

    console.log(`  ✓ Weak Topics detected (${weakTopics.length}): ${weakTopics.map(w => `${w.topic_name} (${w.performance_level}: ${w.recent_percentage}%)`).join(', ')}`);
    console.log(`  ✓ Strong Topics detected (${strongTopics.length}): ${strongTopics.map(s => `${s.topic_name} (${s.performance_level}: ${s.recent_percentage}%)`).join(', ')}`);

    if (weakTopics.length !== 1 || weakTopics[0].topic_id !== topic2Id) {
      throw new Error('Weak topics filter failed.');
    }
    if (strongTopics.length !== 1 || strongTopics[0].topic_id !== topic1Id) {
      throw new Error('Strong topics filter failed.');
    }

    // ▶️ [Test 5] Cross-User Performance Isolation
    console.log('\n▶️ [Test 5] Cross-User Security & Isolation');
    const userBPerformance = await performanceService.getTopicPerformance(userB);
    console.log(`  ✓ User B query to getTopicPerformance returned ${userBPerformance.length} rows (0 leaked).`);
    if (userBPerformance.length !== 0) {
      throw new Error('Cross-user leakage in topic performance!');
    }

    const userBCheckUserATopic = await performanceService.getTopicPerformanceById(userB, topic1Id);
    console.log(`  ✓ User B querying User A topic returned: ${userBCheckUserATopic} (Null/Blocked).`);
    if (userBCheckUserATopic !== null) {
      throw new Error('User B accessed User A individual topic performance!');
    }

    // Clean up
    await query(`DELETE FROM public.topic_performance WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_answers WHERE attempt_id IN (SELECT id FROM public.quiz_attempts WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quiz_attempts WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quizzes WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA, userB]);

    console.log('\n================================================================');
    console.log('🎉 ALL 5 TOPIC PERFORMANCE & WEAK/STRONG TESTS PASSED (100%)');
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runPerformanceTestSuite();
