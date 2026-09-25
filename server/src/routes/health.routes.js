import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

/**
 * GET /health
 * Lightweight liveness probe to verify HTTP server is responsive.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Readiness probe checking live database connectivity.
 * Note: Does not invoke external Gemini AI to avoid rate-limit exhaustion.
 */
router.get('/ready', async (req, res) => {
  try {
    const startTime = Date.now();
    await query('SELECT 1;');
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      db_latency_ms: latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Readiness probe failed: Database unreachable:', err.message);
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: 'Database ping failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
