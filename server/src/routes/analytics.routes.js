/**
 * analytics.routes.js
 *
 * Express router mounting all Phase 9 Student Intelligence & Analytics endpoints.
 * All routes require Supabase JWT authentication.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// Enforce authentication on all analytics routes
router.use(requireAuth);

// Overview dashboard aggregation (single high-performance request)
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));

// Domain-specific analytics
router.get('/study', (req, res, next) => analyticsController.getStudyAnalytics(req, res, next));
router.get('/academic', (req, res, next) => analyticsController.getAcademicAnalytics(req, res, next));
router.get('/quiz', (req, res, next) => analyticsController.getQuizAnalytics(req, res, next));
router.get('/planner', (req, res, next) => analyticsController.getPlannerAnalytics(req, res, next));
router.get('/trends', (req, res, next) => analyticsController.getTrends(req, res, next));
router.get('/insights', (req, res, next) => analyticsController.getInsights(req, res, next));

// Detailed entity drill-down analytics
router.get('/subjects/:subjectId', (req, res, next) => analyticsController.getSubjectAnalytics(req, res, next));
router.get('/topics/:topicId', (req, res, next) => analyticsController.getTopicAnalytics(req, res, next));

// Optional natural-language explanation via Gemini
router.post('/explain-insights', (req, res, next) => analyticsController.explainInsights(req, res, next));

export default router;
