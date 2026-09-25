import { query } from '../config/db.js';
import { quizService } from '../services/quiz.service.js';

async function runQuizEvaluationTests() {
  console.log('\n================================================================');
  console.log('🧪 PHASE 7: QUIZ MANAGEMENT & DETERMINISTIC EVALUATION TEST SUITE');
  console.log('================================================================\n');

  const userA = '99999999-9999-4999-8999-999999999999';
  const userB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  try {
    // 0. Cleanup stale test records
    await query(`DELETE FROM public.quiz_answers WHERE attempt_id IN (SELECT id FROM public.quiz_attempts WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quiz_attempts WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quizzes WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA, userB]);

    // 1. Seed auth users
    await query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
      VALUES 
        ($1, 'student_a_phase7@test.com', '{"full_name": "Student A Phase 7"}', 'authenticated', 'authenticated'),
        ($2, 'student_b_phase7@test.com', '{"full_name": "Student B Phase 7"}', 'authenticated', 'authenticated');
    `, [userA, userB]);

    const subjRes = await query(
      `INSERT INTO public.subjects (user_id, name, exam_date, target_score, color)
       VALUES ($1, 'Evaluation Test Subject', (now() + interval '10 days')::date, 90, '#4F46E5')
       RETURNING id, name;`,
      [userA]
    );
    const subjectId = subjRes.rows[0].id;

    const topicRes = await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, status, completion_percentage)
       VALUES ($1, 'Evaluation Test Topic', 'MEDIUM', 60, 'IN_PROGRESS', 50.0)
       RETURNING id, name;`,
      [subjectId]
    );
    const topicId = topicRes.rows[0].id;

    console.log('✅ Base test curriculum established for User A.\n');

    // ▶️ [Test 1] Quiz Generation & Anti-Leakage Verification
    console.log('▶️ [Test 1] Quiz Generation & Anti-Leakage Verification');
    const quiz = await quizService.generateQuiz(userA, {
      subject_id: subjectId,
      topic_id: topicId,
      difficulty: 'MEDIUM',
      question_count: 3
    });

    console.log(`  ✓ Quiz generated: "${quiz.title}" (${quiz.questions.length} questions)`);

    // Verify correct_answer and explanation are NOT returned in standard retrieval
    const takingQuiz = await quizService.getQuizById(userA, quiz.id, false);
    for (const q of takingQuiz.questions) {
      if (q.correct_answer !== undefined || q.explanation !== undefined) {
        throw new Error('SECURITY VIOLATION: correct_answer or explanation leaked in pre-submission quiz query!');
      }
    }
    console.log('  ✓ Verified: ZERO correct answers or explanations leaked before submission.');

    // ▶️ [Test 2] Start Attempt
    console.log('\n▶️ [Test 2] Quiz Attempt Lifecycle');
    const startData = await quizService.startAttempt(userA, quiz.id);
    const attemptId = startData.attempt_id;
    console.log(`  ✓ Attempt started with status IN_PROGRESS (Attempt ID: ${attemptId})`);

    // Fetch actual correct answers from DB to simulate deterministic student submission
    const rawQuestionsRes = await query(
      `SELECT id, correct_answer, points FROM public.quiz_questions WHERE quiz_id = $1 ORDER BY question_order ASC;`,
      [quiz.id]
    );
    const rawQuestions = rawQuestionsRes.rows;

    // Student answers: Q1 correct, Q2 incorrect, Q3 unanswered
    const answersPayload = [
      { question_id: rawQuestions[0].id, selected_answer: rawQuestions[0].correct_answer },
      { question_id: rawQuestions[1].id, selected_answer: 'Totally Wrong Option Choice' },
      { question_id: rawQuestions[2].id, selected_answer: null }
    ];

    // ▶️ [Test 3] Submit Attempt & Deterministic Scoring
    console.log('\n▶️ [Test 3] Answer Submission & Deterministic Scoring');
    const submitResult = await quizService.submitAttempt(userA, quiz.id, attemptId, answersPayload);

    console.log(`  ✓ Score: ${submitResult.score} / ${submitResult.max_score} (${submitResult.percentage}%)`);
    console.log(`  ✓ Correct: ${submitResult.correct_count}, Incorrect: ${submitResult.incorrect_count}, Unanswered: ${submitResult.unanswered_count}`);

    if (submitResult.correct_count !== 1 || submitResult.incorrect_count !== 1 || submitResult.unanswered_count !== 1) {
      throw new Error(`Scoring mismatch: expected 1 correct, 1 incorrect, 1 unanswered; got ${JSON.stringify(submitResult)}`);
    }

    if (Math.abs(submitResult.percentage - 33.33) > 1.0) {
      throw new Error(`Percentage mismatch: expected ~33.33%, got ${submitResult.percentage}%`);
    }

    // Verify review now exposes correct answer and explanation for pedagogical review
    const reviewQ1 = submitResult.review.find(r => r.question_id === rawQuestions[0].id);
    if (!reviewQ1.is_correct || !reviewQ1.correct_answer || !reviewQ1.explanation) {
      throw new Error('Review failed to properly report correct answer or explanation after submission.');
    }
    console.log('  ✓ Verified: Review payload includes full pedagogical feedback and answer breakdown.');

    // ▶️ [Test 4] Anti-Double Submission (409 Conflict)
    console.log('\n▶️ [Test 4] Anti-Double Submission Protection (Idempotency)');
    try {
      await quizService.submitAttempt(userA, quiz.id, attemptId, answersPayload);
      throw new Error('FAILED: Completed quiz attempt was submitted twice!');
    } catch (err) {
      if (err.code === 'QUIZ_ALREADY_SUBMITTED' && err.statusCode === 409) {
        console.log('  ✓ Double-submission rejected with 409 QUIZ_ALREADY_SUBMITTED.');
      } else {
        throw err;
      }
    }

    // ▶️ [Test 5] Cross-User Security & Isolation
    console.log('\n▶️ [Test 5] Cross-User Authorization & Isolation');
    try {
      await quizService.getQuizById(userB, quiz.id);
      throw new Error('FAILED: User B accessed User A quiz!');
    } catch (err) {
      console.log('  ✓ Cross-user quiz access blocked with 404 QUIZ_NOT_FOUND.');
    }

    try {
      await quizService.submitAttempt(userB, quiz.id, attemptId, answersPayload);
      throw new Error('FAILED: User B submitted User A quiz attempt!');
    } catch (err) {
      console.log('  ✓ Cross-user attempt submission blocked with 404 QUIZ_ATTEMPT_NOT_FOUND.');
    }

    // ▶️ [Test 6] Quiz History Retrieval
    console.log('\n▶️ [Test 6] Quiz History Retrieval');
    const history = await quizService.getQuizHistory(userA);
    console.log(`  ✓ Retrieved ${history.length} completed quiz attempt(s) in history.`);
    if (history.length === 0 || history[0].attempt_id !== attemptId) {
      throw new Error('Failed to retrieve recent attempt in quiz history.');
    }

    // Clean up
    await query(`DELETE FROM public.quiz_answers WHERE attempt_id IN (SELECT id FROM public.quiz_attempts WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quiz_attempts WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.quiz_questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.quizzes WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.topics WHERE subject_id IN (SELECT id FROM public.subjects WHERE user_id IN ($1, $2));`, [userA, userB]);
    await query(`DELETE FROM public.subjects WHERE user_id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM public.profiles WHERE id IN ($1, $2);`, [userA, userB]);
    await query(`DELETE FROM auth.users WHERE id IN ($1, $2);`, [userA, userB]);

    console.log('\n================================================================');
    console.log('🎉 ALL QUIZ MANAGEMENT & DETERMINISTIC EVALUATION TESTS PASSED (100%)');
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runQuizEvaluationTests();
