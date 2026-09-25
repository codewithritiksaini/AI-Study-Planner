/**
 * analytics.validator.js
 *
 * Zod validation schemas for Phase 9 Analytics API requests.
 */

import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_DAYS = [7, 14, 30, 90];

/**
 * Validates days query parameter (strictly coerced and restricted to 7, 14, 30, 90).
 */
export const analyticsQuerySchema = z.object({
  days: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : 30),
    z.number().int().refine((d) => ALLOWED_DAYS.includes(d), {
      message: 'days parameter must be one of [7, 14, 30, 90]'
    })
  )
});

/**
 * Validates subjectId parameter.
 */
export const subjectAnalyticsParamsSchema = z.object({
  subjectId: z.string().regex(uuidRegex, 'Invalid subjectId; must be a valid UUID')
});

/**
 * Validates topicId parameter.
 */
export const topicAnalyticsParamsSchema = z.object({
  topicId: z.string().regex(uuidRegex, 'Invalid topicId; must be a valid UUID')
});
