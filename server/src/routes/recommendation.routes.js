/**
 * recommendation.routes.js
 *
 * REST API routes for Phase 10: Personalized Study Recommendation Engine.
 * All endpoints are secured by Supabase Bearer token / backend session auth (`requireAuth`).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { recommendationController } from '../controllers/recommendation.controller.js';

const router = Router();

// Apply auth middleware to all recommendation routes
router.use(requireAuth);

// 1. Get active recommendations with optional filters (?limit, ?type, ?priority, ?subjectId, ?forceRefresh)
router.get('/', (req, res) => recommendationController.getRecommendations(req, res));

// 2. Force fresh recommendation regeneration
router.post('/refresh', (req, res) => recommendationController.refreshRecommendations(req, res));

// 3. Recommendation history (COMPLETED, DISMISSED, EXPIRED)
router.get('/history', (req, res) => recommendationController.getHistory(req, res));

// 4. Quality & engagement metrics summary
router.get('/metrics/summary', (req, res) => recommendationController.getMetricsSummary(req, res));

// 5. Get single recommendation detail
router.get('/:id', (req, res) => recommendationController.getRecommendationById(req, res));

// 6. Record feedback (HELPFUL, NOT_HELPFUL, DISMISS, COMPLETED)
router.post('/:id/feedback', (req, res) => recommendationController.submitFeedback(req, res));

// 7. Dismiss recommendation
router.post('/:id/dismiss', (req, res) => recommendationController.dismissRecommendation(req, res));

// 8. Mark recommendation completed
router.post('/:id/complete', (req, res) => recommendationController.completeRecommendation(req, res));

export default router;
