import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { adminController } from '../controllers/admin.controller.js';

const router = Router();

// Strict security perimeter: All /api/admin/* endpoints require valid session and admin role
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/overview
 * Platform-wide counters, health metrics, and database latency.
 */
router.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));

/**
 * GET /api/admin/students
 * Paginated student directory with academic counters.
 */
router.get('/students', (req, res, next) => adminController.getStudents(req, res, next));

export default router;
