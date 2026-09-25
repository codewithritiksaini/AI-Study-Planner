import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getRecommendation,
  explainPlan,
  getStudyStrategy,
  askAI
} from '../controllers/ai.controller.js';

const router = Router();

// Enforce authentication on all AI advisory endpoints
router.use(requireAuth);

// 1. Personalized Daily Recommendation
router.post('/recommendation', getRecommendation);

// 2. Natural-Language Explanation of Rule-Based Plan
router.post('/explain-plan', explainPlan);

// 3. Tactical Topic Study Roadmap
router.post('/study-strategy', getStudyStrategy);

// 4. Grounded Study Question & Answer
router.post('/ask', askAI);

export default router;
