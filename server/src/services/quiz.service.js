import { getDbPool, query } from '../config/db.js';
import { aiService } from './ai.service.js';
import { performanceService } from './performance.service.js';

class QuizService {
  /**
   * Generates a new conceptual AI quiz and persists it with its questions in PostgreSQL.
   * Strips correct answers before returning to the caller.
   *
   * @param {string} userId - UUID
   * @param {Object} params
   * @param {string} params.subject_id - UUID
   * @param {string} params.topic_id - UUID
   * @param {string} params.difficulty - 'EASY' | 'MEDIUM' | 'HARD'
   * @param {number} params.question_count - 3 to 20
   * @returns {Promise<Object>} Created quiz metadata with questions (without answer keys)
   */
  async generateQuiz(userId, { subject_id, topic_id, difficulty = 'MEDIUM', question_count = 5 }) {
    // 1. Verify subject ownership
    const subjRes = await query(
      `SELECT id, name FROM public.subjects WHERE id = $1 AND user_id = $2;`,
      [subject_id, userId]
    );

    if (subjRes.rows.length === 0) {
      const err = new Error('Subject not found or access denied.');
      err.code = 'SUBJECT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    const subject = subjRes.rows[0];

    // 2. Verify topic ownership and relation to subject
    const topicRes = await query(
      `SELECT id, name, description, difficulty 
       FROM public.topics 
       WHERE id = $1 AND subject_id = $2;`,
      [topic_id, subject_id]
    );

    if (topicRes.rows.length === 0) {
      const err = new Error('Topic not found or does not belong to the selected subject.');
      err.code = 'TOPIC_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    const topic = topicRes.rows[0];

    // 3. Generate structured MCQs using Gemini
    const aiQuiz = await aiService.generateQuizContent({
      subjectName: subject.name,
      topicName: topic.name,
      topicDescription: topic.description,
      difficulty,
      questionCount: question_count
    });

    // 4. Transactionally store quiz and quiz_questions
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const quizInsertRes = await client.query(
        `INSERT INTO public.quizzes (
            user_id,
            subject_id,
            topic_id,
            title,
            description,
            difficulty,
            question_count,
            source,
            created_at,
            updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone('utc'::text, now()), timezone('utc'::text, now()))
         RETURNING *;`,
        [
          userId,
          subject_id,
          topic_id,
          aiQuiz.title || `${subject.name} — ${topic.name} Quiz`,
          aiQuiz.description || `Assessment on ${topic.name}`,
          difficulty,
          aiQuiz.questions.length,
          'AI'
        ]
      );

      const createdQuiz = quizInsertRes.rows[0];
      const createdQuestions = [];

      for (let i = 0; i < aiQuiz.questions.length; i++) {
        const q = aiQuiz.questions[i];
        const qRes = await client.query(
          `INSERT INTO public.quiz_questions (
              quiz_id,
              question_text,
              question_type,
              options,
              correct_answer,
              explanation,
              points,
              question_order,
              created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone('utc'::text, now()))
           RETURNING id, quiz_id, question_text, question_type, options, points, question_order;`,
          [
            createdQuiz.id,
            q.question_text,
            'MCQ',
            JSON.stringify(q.options),
            q.correct_answer,
            q.explanation,
            q.points || 1,
            i + 1
          ]
        );
        createdQuestions.push(qRes.rows[0]);
      }

      await client.query('COMMIT');

      // Return quiz without exposing correct_answer or explanation
      return {
        ...createdQuiz,
        subject_name: subject.name,
        topic_name: topic.name,
        questions: createdQuestions
      };
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('Failed to store generated quiz in database:', dbErr.message);
      throw dbErr;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves user's quizzes with optional subject or topic filters.
   */
  async getQuizzes(userId, filters = {}) {
    let queryText = `
      SELECT 
        q.id,
        q.user_id,
        q.subject_id,
        q.topic_id,
        q.title,
        q.description,
        q.difficulty,
        q.question_count,
        q.source,
        q.created_at,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name,
        (
          SELECT COUNT(*) 
          FROM public.quiz_attempts qa 
          WHERE qa.quiz_id = q.id AND qa.status = 'COMPLETED'
        ) AS completed_attempts_count
      FROM public.quizzes q
      JOIN public.subjects s ON q.subject_id = s.id
      JOIN public.topics t ON q.topic_id = t.id
      WHERE q.user_id = $1
    `;
    const params = [userId];

    if (filters.subject_id) {
      params.push(filters.subject_id);
      queryText += ` AND q.subject_id = $${params.length}`;
    }

    if (filters.topic_id) {
      params.push(filters.topic_id);
      queryText += ` AND q.topic_id = $${params.length}`;
    }

    if (filters.difficulty) {
      params.push(filters.difficulty);
      queryText += ` AND q.difficulty = $${params.length}`;
    }

    queryText += ` ORDER BY q.created_at DESC;`;

    const res = await query(queryText, params);
    return res.rows;
  }

  /**
   * Retrieves a single quiz by ID.
   * If includeAnswers is false (default), strips correct_answer and explanation to prevent answer leakage!
   */
  async getQuizById(userId, quizId, includeAnswers = false) {
    const quizRes = await query(
      `SELECT 
        q.*,
        s.name AS subject_name,
        s.color AS subject_color,
        t.name AS topic_name
       FROM public.quizzes q
       JOIN public.subjects s ON q.subject_id = s.id
       JOIN public.topics t ON q.topic_id = t.id
       WHERE q.id = $1 AND q.user_id = $2;`,
      [quizId, userId]
    );

    if (quizRes.rows.length === 0) {
      const err = new Error('Quiz not found or unauthorized.');
      err.code = 'QUIZ_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const quiz = quizRes.rows[0];

    const questionsQuery = includeAnswers
      ? `SELECT id, quiz_id, question_text, question_type, options, correct_answer, explanation, points, question_order
         FROM public.quiz_questions
         WHERE quiz_id = $1
         ORDER BY question_order ASC;`
      : `SELECT id, quiz_id, question_text, question_type, options, points, question_order
         FROM public.quiz_questions
         WHERE quiz_id = $1
         ORDER BY question_order ASC;`;

    const questionsRes = await query(questionsQuery, [quizId]);
    quiz.questions = questionsRes.rows;

    return quiz;
  }

  /**
   * Starts a new quiz attempt for an authenticated student.
   * Returns attempt ID and questions strictly WITHOUT correct answers or explanations.
   */
  async startAttempt(userId, quizId) {
    const quiz = await this.getQuizById(userId, quizId, false);

    const attemptRes = await query(
      `INSERT INTO public.quiz_attempts (
          quiz_id,
          user_id,
          status,
          started_at,
          created_at,
          updated_at
       ) VALUES ($1, $2, 'IN_PROGRESS', timezone('utc'::text, now()), timezone('utc'::text, now()), timezone('utc'::text, now()))
       RETURNING *;`,
      [quizId, userId]
    );

    const attempt = attemptRes.rows[0];

    return {
      attempt_id: attempt.id,
      started_at: attempt.started_at,
      quiz
    };
  }

  /**
   * Deterministically evaluates submitted answers, computes score & percentage,
   * stores answers, marks attempt COMPLETED, and triggers topic performance update.
   */
  async submitAttempt(userId, quizId, attemptId, submittedAnswers = []) {
    // 1. Verify attempt ownership and state
    const attemptRes = await query(
      `SELECT * FROM public.quiz_attempts WHERE id = $1 AND quiz_id = $2 AND user_id = $3;`,
      [attemptId, quizId, userId]
    );

    if (attemptRes.rows.length === 0) {
      const err = new Error('Quiz attempt not found or unauthorized.');
      err.code = 'QUIZ_ATTEMPT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const attempt = attemptRes.rows[0];

    // Anti-double submission guard
    if (attempt.status === 'COMPLETED') {
      const err = new Error('This quiz attempt has already been submitted and finalized.');
      err.code = 'QUIZ_ALREADY_SUBMITTED';
      err.statusCode = 409;
      throw err;
    }

    // 2. Fetch quiz details & full questions including correct_answer
    const quizRes = await query(
      `SELECT * FROM public.quizzes WHERE id = $1 AND user_id = $2;`,
      [quizId, userId]
    );
    const quiz = quizRes.rows[0];

    const questionsRes = await query(
      `SELECT id, question_text, options, correct_answer, points, explanation, question_order
       FROM public.quiz_questions
       WHERE quiz_id = $1
       ORDER BY question_order ASC;`,
      [quizId]
    );
    const questions = questionsRes.rows;

    const questionMap = new Map();
    questions.forEach(q => questionMap.set(q.id, q));

    // 3. Validate submitted question IDs and check for duplicate submissions
    const submittedQuestionIds = new Set();
    const submissionMap = new Map();

    for (const ans of submittedAnswers) {
      if (!questionMap.has(ans.question_id)) {
        const err = new Error(`Question ${ans.question_id} does not belong to this quiz.`);
        err.code = 'QUESTION_NOT_IN_QUIZ';
        err.statusCode = 400;
        throw err;
      }

      if (submittedQuestionIds.has(ans.question_id)) {
        const err = new Error(`Duplicate answer entry for question ${ans.question_id}.`);
        err.code = 'DUPLICATE_ANSWER_SUBMISSION';
        err.statusCode = 400;
        throw err;
      }

      submittedQuestionIds.add(ans.question_id);
      submissionMap.set(ans.question_id, ans.selected_answer);
    }

    // 4. Deterministic score calculation
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const evaluatedAnswers = [];
    const review = [];

    for (const q of questions) {
      const qPoints = Number(q.points) || 1;
      maxScore += qPoints;

      const studentAnswer = submissionMap.get(q.id);

      if (!studentAnswer || studentAnswer.trim() === '') {
        unansweredCount++;
        evaluatedAnswers.push({
          question_id: q.id,
          selected_answer: null,
          is_correct: false,
          points_earned: 0
        });
        review.push({
          question_id: q.id,
          question_text: q.question_text,
          options: q.options,
          selected_answer: null,
          correct_answer: q.correct_answer,
          is_correct: false,
          points_earned: 0,
          explanation: q.explanation
        });
        continue;
      }

      // Exact case-insensitive match against stored answer
      const isCorrect = studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      const pointsEarned = isCorrect ? qPoints : 0;

      if (isCorrect) {
        correctCount++;
        totalScore += pointsEarned;
      } else {
        incorrectCount++;
      }

      evaluatedAnswers.push({
        question_id: q.id,
        selected_answer: studentAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned
      });

      review.push({
        question_id: q.id,
        question_text: q.question_text,
        options: q.options,
        selected_answer: studentAnswer,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        explanation: q.explanation
      });
    }

    const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;

    // 5. Transaction: Save answers, update attempt, and update topic_performance
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert evaluated answers
      for (const ans of evaluatedAnswers) {
        await client.query(
          `INSERT INTO public.quiz_answers (
              attempt_id,
              question_id,
              selected_answer,
              is_correct,
              points_earned,
              answered_at
           ) VALUES ($1, $2, $3, $4, $5, timezone('utc'::text, now()));`,
          [
            attemptId,
            ans.question_id,
            ans.selected_answer,
            ans.is_correct,
            ans.points_earned
          ]
        );
      }

      // Mark attempt COMPLETED with calculated metrics
      await client.query(
        `UPDATE public.quiz_attempts SET
            submitted_at = timezone('utc'::text, now()),
            score = $1,
            max_score = $2,
            percentage = $3,
            correct_count = $4,
            incorrect_count = $5,
            unanswered_count = $6,
            status = 'COMPLETED',
            updated_at = timezone('utc'::text, now())
         WHERE id = $7;`,
        [
          totalScore,
          maxScore,
          percentage,
          correctCount,
          incorrectCount,
          unansweredCount,
          attemptId
        ]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('Quiz submission transaction failed:', txErr.message);
      throw txErr;
    } finally {
      client.release();
    }

    // 6. Recalculate topic performance
    let updatedPerformance = null;
    try {
      updatedPerformance = await performanceService.updateTopicPerformance(userId, quiz.topic_id);
    } catch (perfErr) {
      console.warn('Failed to update topic performance after quiz submission:', perfErr.message);
    }

    return {
      attempt_id: attemptId,
      quiz_id: quizId,
      score: totalScore,
      max_score: maxScore,
      percentage,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      performance: updatedPerformance ? {
        level: updatedPerformance.performance_level,
        average_percentage: updatedPerformance.average_percentage,
        recent_percentage: updatedPerformance.recent_percentage,
        attempt_count: updatedPerformance.attempt_count
      } : null,
      review
    };
  }

  /**
   * Retrieves quiz attempt history for student.
   */
  async getQuizHistory(userId, limit = 20) {
    const res = await query(
      `SELECT 
          qa.id AS attempt_id,
          qa.quiz_id,
          qa.score,
          qa.max_score,
          qa.percentage,
          qa.correct_count,
          qa.incorrect_count,
          qa.unanswered_count,
          qa.status,
          qa.started_at,
          qa.submitted_at,
          q.title AS quiz_title,
          q.difficulty AS quiz_difficulty,
          q.question_count,
          s.name AS subject_name,
          s.color AS subject_color,
          t.name AS topic_name
       FROM public.quiz_attempts qa
       JOIN public.quizzes q ON qa.quiz_id = q.id
       JOIN public.subjects s ON q.subject_id = s.id
       JOIN public.topics t ON q.topic_id = t.id
       WHERE qa.user_id = $1 AND qa.status = 'COMPLETED'
       ORDER BY qa.submitted_at DESC
       LIMIT $2;`,
      [userId, limit]
    );

    return res.rows;
  }

  /**
   * Retrieves a completed attempt review by ID.
   */
  async getAttemptReview(userId, attemptId) {
    const attemptRes = await query(
      `SELECT 
          qa.*,
          q.title AS quiz_title,
          q.difficulty AS quiz_difficulty,
          s.name AS subject_name,
          s.color AS subject_color,
          t.name AS topic_name
       FROM public.quiz_attempts qa
       JOIN public.quizzes q ON qa.quiz_id = q.id
       JOIN public.subjects s ON q.subject_id = s.id
       JOIN public.topics t ON q.topic_id = t.id
       WHERE qa.id = $1 AND qa.user_id = $2;`,
      [attemptId, userId]
    );

    if (attemptRes.rows.length === 0) {
      const err = new Error('Quiz attempt not found or unauthorized.');
      err.code = 'QUIZ_ATTEMPT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const attempt = attemptRes.rows[0];

    const answersRes = await query(
      `SELECT 
          qa.selected_answer,
          qa.is_correct,
          qa.points_earned,
          qq.id AS question_id,
          qq.question_text,
          qq.options,
          qq.correct_answer,
          qq.explanation,
          qq.points,
          qq.question_order
       FROM public.quiz_answers qa
       JOIN public.quiz_questions qq ON qa.question_id = qq.id
       WHERE qa.attempt_id = $1
       ORDER BY qq.question_order ASC;`,
      [attemptId]
    );

    attempt.review = answersRes.rows;
    return attempt;
  }

  /**
   * Generates an on-demand AI explanation for a specific question within a quiz.
   */
  async explainQuestion(userId, quizId, questionId, selectedAnswer = null) {
    // 1. Verify question belongs to user's quiz
    const qRes = await query(
      `SELECT 
          qq.id,
          qq.question_text,
          qq.correct_answer,
          qq.explanation,
          t.name AS topic_name
       FROM public.quiz_questions qq
       JOIN public.quizzes q ON qq.quiz_id = q.id
       JOIN public.topics t ON q.topic_id = t.id
       WHERE qq.id = $1 AND q.id = $2 AND q.user_id = $3;`,
      [questionId, quizId, userId]
    );

    if (qRes.rows.length === 0) {
      const err = new Error('Question not found or unauthorized.');
      err.code = 'QUESTION_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const question = qRes.rows[0];

    return await aiService.explainQuizQuestion({
      topicName: question.topic_name,
      questionText: question.question_text,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      existingExplanation: question.explanation
    });
  }
}

export const quizService = new QuizService();
