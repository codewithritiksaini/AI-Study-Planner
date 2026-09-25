import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  generatePlan,
  getTodayPlan,
  getPlanByDate,
  getWeeklyPlan,
  updatePlanStatus
} from '../controllers/planner.controller.js';

const router = Router();

// All planner endpoints require Supabase Auth authentication
router.use(requireAuth);

// Plan generation (supports ?date=YYYY-MM-DD and force_regenerate)
router.post('/generate', generatePlan);

// Today's plan view with aggregated metrics
router.get('/today', getTodayPlan);

// Weekly 7-day overview
router.get('/week', getWeeklyPlan);

// Get plan by date (?date=YYYY-MM-DD)
router.get('/', getPlanByDate);

// Update plan status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED)
router.patch('/:id/status', updatePlanStatus);

export default router;
