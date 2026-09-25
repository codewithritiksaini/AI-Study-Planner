import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System availability healthcheck endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Study Planner API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default router;
