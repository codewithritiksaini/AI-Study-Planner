import express from 'express';
import {
  getTopicById,
  updateTopic,
  updateTopicProgress,
  deleteTopic
} from '../controllers/topic.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All topic endpoints require authentication
router.use(requireAuth);

router.get('/:id', getTopicById);
router.put('/:id', updateTopic);
router.patch('/:id/progress', updateTopicProgress);
router.delete('/:id', deleteTopic);

export default router;
