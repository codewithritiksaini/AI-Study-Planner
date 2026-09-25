import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ERROR_CODES } from '../utils/errors.js';

/**
 * Standard API Rate Limiter
 * 120 requests per minute for normal CRUD operations.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'test' ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many requests. Please wait a moment before trying again.'
    }
  }
});

/**
 * Sensitive / AI / Expensive Schedule Generation Limiter
 * 20 requests per minute to prevent abuse or rapid double-clicks.
 */
export const aiAndGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMITED,
      message: 'Too many AI or schedule generation requests. Please wait a moment before generating again.'
    }
  }
});

export default {
  apiLimiter,
  aiAndGenerationLimiter
};
