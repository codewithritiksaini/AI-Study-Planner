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
import * as schedulerController from '../controllers/scheduler.controller.js';

const router = Router();

// All planner endpoints require Supabase Auth authentication
router.use(requireAuth);

// ==============================================================================
// PHASE 11: INTELLIGENT ADAPTIVE STUDY SCHEDULING ENDPOINTS
// ==============================================================================
// Daily & Weekly views
router.get('/daily', schedulerController.getDailyPlan);
router.get('/weekly', schedulerController.getWeeklyPlan);

// Weekly Availability
router.get('/availability', schedulerController.getAvailability);
router.post('/availability', schedulerController.createAvailability);
router.put('/availability/:id', schedulerController.updateAvailability);
router.delete('/availability/:id', schedulerController.deleteAvailability);

// Blocked Periods
router.get('/blocked-periods', schedulerController.getBlockedPeriods);
router.post('/blocked-periods', schedulerController.createBlockedPeriod);
router.delete('/blocked-periods/:id', schedulerController.deleteBlockedPeriod);

// Smart Plan Generation & Transactional Apply
router.post('/preview', schedulerController.generatePlanPreview);
router.post('/apply', schedulerController.applyPlan);

// Session Lock & Missed Session Reschedule
router.post('/sessions/:id/lock', schedulerController.toggleSessionLock);
router.post('/sessions/:id/reschedule', schedulerController.handleRescheduleSession);

// Manual Sessions
router.post('/sessions', schedulerController.createManualSession);
router.delete('/sessions/:id', schedulerController.deleteSession);

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
