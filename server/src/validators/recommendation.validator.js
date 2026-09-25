/**
 * recommendation.validator.js
 *
 * Zod validation schemas for Phase 10 Recommendation API requests.
 */

import { z } from 'zod';
import { recommendationConfig } from '../config/recommendation.config.js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getRecommendationsQuerySchema = z.object({
  limit: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : 5),
    z.number().int().min(1).max(20).default(5)
  ),
  type: z.enum(Object.values(recommendationConfig.TYPES)).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  subjectId: z.string().regex(uuidRegex, 'Invalid subjectId; must be a valid UUID').optional(),
  forceRefresh: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false))
});

export const recommendationIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid recommendationId; must be a valid UUID')
});

export const recommendationFeedbackSchema = z.object({
  feedback: z.enum(['HELPFUL', 'NOT_HELPFUL', 'DISMISS', 'COMPLETED'], {
    errorMap: () => ({ message: 'feedback must be one of [HELPFUL, NOT_HELPFUL, DISMISS, COMPLETED]' })
  })
});

export const refreshRecommendationsSchema = z.object({
  limit: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : 5),
    z.number().int().min(1).max(10).default(5)
  )
});
