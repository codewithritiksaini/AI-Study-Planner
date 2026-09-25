import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getTopicPerformance,
  getTopicPerformanceById,
  getWeakTopics,
  getStrongTopics
} from '../controllers/performance.controller.js';

const router = Router();

// Enforce authentication across all performance endpoints
router.use(requireAuth);

router.get('/topics', getTopicPerformance);
router.get('/topics/:topicId', getTopicPerformanceById);
router.get('/weak-topics', getWeakTopics);
router.get('/strong-topics', getStrongTopics);

export default router;
