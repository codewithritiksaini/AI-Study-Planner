import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  generatePlan,
  getTodayPlan,
  getPlanByDate,
  getWeeklyPlan,
  updatePlanStatus
} from '../controllers/planner.controller.js';
import {
  generateAdaptivePlan,
  regenerateAdaptivePlan,
  getAdaptiveToday,
  getAdaptiveWeek,
  explainAdaptivePlan,
  updatePlanStatus as updateAdaptivePlanStatus
} from '../controllers/adaptive-planner.controller.js';

const router = Router();

// All planner endpoints require Supabase Auth authentication
router.use(requireAuth);

// ==============================================================================
// PHASE 8: ADAPTIVE STUDY PLANNER ENDPOINTS
// ==============================================================================
router.post('/adaptive/generate', generateAdaptivePlan);
router.post('/adaptive/regenerate', regenerateAdaptivePlan);
router.get('/adaptive/today', getAdaptiveToday);
router.get('/adaptive', getAdaptiveToday);
router.get('/adaptive/week', getAdaptiveWeek);
router.post('/adaptive/explain', explainAdaptivePlan);
router.patch('/adaptive/:id/status', updateAdaptivePlanStatus);

// ==============================================================================
// PHASE 5: DETERMINISTIC RULE-BASED PLANNER ENDPOINTS (BACKWARD COMPATIBLE)
// ==============================================================================
// Plan generation (supports ?date=YYYY-MM-DD and force_regenerate)
router.post('/generate', generatePlan);

// Today's plan view with aggregated metrics
router.get('/today', getTodayPlan);

// Weekly 7-day overview
router.get('/week', getWeeklyPlan);

// Get plan by date (?date=YYYY-MM-DD)
router.get('/', getPlanByDate);

// Update plan status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED, MISSED)
router.patch('/:id/status', updateAdaptivePlanStatus);

export default router;
