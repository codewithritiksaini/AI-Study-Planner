import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  startSession,
  getActiveSession,
  completeSession,
  cancelSession,
  getTodaySessions,
  getSessionHistory,
  getStudySummary,
  getSessionById
} from '../controllers/study.controller.js';

const router = Router();

// Enforce authentication on all study session routes
router.use(requireAuth);

// Active & Session Lifecycle
router.post('/start', startSession);
router.get('/active', getActiveSession);
router.post('/:id/complete', completeSession);
router.post('/:id/cancel', cancelSession);

// Reporting & History
router.get('/today', getTodaySessions);
router.get('/history', getSessionHistory);
router.get('/summary', getStudySummary);
router.get('/:id', getSessionById);

export default router;
