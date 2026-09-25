/**
 * scheduler.validator.js
 *
 * Zod validation schemas for Phase 11 Intelligent Adaptive Study Scheduling:
 * - Weekly study availability CRUD
 * - Blocked periods CRUD
 * - Smart plan generation preview & apply
 * - Session lock toggle and rescheduling
 * - Manual custom session creation and editing
 */

import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID format');

export const availabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6, 'day_of_week must be between 0 (Sunday) and 6 (Saturday)'),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:MM or HH:MM:SS'),
  end_time: z.string().regex(timeRegex, 'end_time must be HH:MM or HH:MM:SS'),
  is_active: z.boolean().optional().default(true)
}).refine((data) => {
  const [sh, sm] = data.start_time.split(':').map(Number);
  const [eh, em] = data.end_time.split(':').map(Number);
  return (eh * 60 + em) > (sh * 60 + sm);
}, {
  message: 'end_time must be later than start_time',
  path: ['end_time']
});

export const blockedPeriodSchema = z.object({
  day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  date: z.string().regex(dateRegex, 'date must be formatted as YYYY-MM-DD').optional().nullable(),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:MM or HH:MM:SS'),
  end_time: z.string().regex(timeRegex, 'end_time must be HH:MM or HH:MM:SS'),
  reason: z.string().max(255).optional().nullable()
}).refine((data) => {
  return data.day_of_week !== undefined && data.day_of_week !== null || Boolean(data.date);
}, {
  message: 'Either day_of_week or date must be provided for blocked period',
  path: ['day_of_week']
}).refine((data) => {
  const [sh, sm] = data.start_time.split(':').map(Number);
  const [eh, em] = data.end_time.split(':').map(Number);
  return (eh * 60 + em) > (sh * 60 + sm);
}, {
  message: 'end_time must be later than start_time',
  path: ['end_time']
});

export const generatePlanPreviewSchema = z.object({
  period_start: z.string().regex(dateRegex, 'period_start must be formatted as YYYY-MM-DD').optional(),
  period_end: z.string().regex(dateRegex, 'period_end must be formatted as YYYY-MM-DD').optional(),
  include_ai_explanation: z.boolean().optional().default(true)
});

export const applyPlanSchema = z.object({
  generation_id: z.string().regex(uuidRegex, 'generation_id must be a valid UUID')
});

export const manualSessionSchema = z.object({
  date: z.string().regex(dateRegex, 'date must be formatted as YYYY-MM-DD'),
  start_time: z.string().regex(timeRegex, 'start_time must be HH:MM or HH:MM:SS'),
  end_time: z.string().regex(timeRegex, 'end_time must be HH:MM or HH:MM:SS'),
  planned_minutes: z.number().int().min(10).max(360, 'planned_minutes must be between 10 and 360'),
  subject_id: z.string().regex(uuidRegex).optional().nullable(),
  topic_id: z.string().regex(uuidRegex).optional().nullable(),
  custom_title: z.string().min(1, 'custom_title is required').max(255),
  is_locked: z.boolean().optional().default(true)
}).refine((data) => {
  const [sh, sm] = data.start_time.split(':').map(Number);
  const [eh, em] = data.end_time.split(':').map(Number);
  return (eh * 60 + em) > (sh * 60 + sm);
}, {
  message: 'end_time must be later than start_time',
  path: ['end_time']
});

export default {
  uuidSchema,
  availabilitySchema,
  blockedPeriodSchema,
  generatePlanPreviewSchema,
  applyPlanSchema,
  manualSessionSchema
};
