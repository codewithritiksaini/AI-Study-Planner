import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  startAttempt,
  submitAttempt,
  getHistory,
  getAttemptById,
  explainQuestion
} from '../controllers/quiz.controller.js';

const router = Router();

// Enforce authentication across all quiz operations
router.use(requireAuth);

// 1. Generation & History endpoints
router.post('/generate', generateQuiz);
router.get('/history', getHistory);
router.get('/attempts/:attemptId', getAttemptById);

// 2. Collection & specific quiz retrieval
router.get('/', getQuizzes);
router.get('/:id', getQuizById);

// 3. Quiz taking lifecycle
router.post('/:id/start', startAttempt);
router.post('/:id/attempts/:attemptId/submit', submitAttempt);

// 4. On-demand AI explanation for incorrect questions
router.post('/:id/questions/:questionId/explain', explainQuestion);

export default router;
