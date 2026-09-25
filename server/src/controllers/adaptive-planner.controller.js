import { z } from 'zod';
import { adaptivePlannerService } from '../services/adaptive-planner.service.js';
import { aiService } from '../services/ai.service.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';

// ==============================================================================
// VALIDATION SCHEMAS
// ==============================================================================

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const generateAdaptiveSchema = z.object({
  start_date: z.string().regex(dateRegex, 'start_date must be formatted as YYYY-MM-DD').optional(),
  days: z.number().int().min(1).max(14).optional().default(7),
  force_regenerate: z.boolean().optional()
});

const regenerateAdaptiveSchema = z.object({
  start_date: z.string().regex(dateRegex, 'start_date must be formatted as YYYY-MM-DD').optional(),
  days: z.number().int().min(1).max(14).optional().default(7)
});

const getWeeklyQuerySchema = z.object({
  start_date: z.string().regex(dateRegex, 'start_date must be formatted as YYYY-MM-DD').optional()
});

const updateStatusSchema = z.object({
  status: z.enum([
    PLANNER_CONFIG.statuses.PENDING,
    PLANNER_CONFIG.statuses.IN_PROGRESS,
    PLANNER_CONFIG.statuses.COMPLETED,
    PLANNER_CONFIG.statuses.MISSED,
    PLANNER_CONFIG.statuses.SKIPPED
  ], {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(PLANNER_CONFIG.statuses).join(', ')}` })
  })
});

const explainSchema = z.object({
  plan_date: z.string().regex(dateRegex, 'plan_date must be formatted as YYYY-MM-DD').optional()
});

const uuidParamSchema = z.string().regex(uuidRegex, 'Invalid plan ID; must be a valid UUID');

// ==============================================================================
// CONTROLLER HANDLERS
// ==============================================================================

/**
 * Generates an intelligent, feedback-driven adaptive study plan.
 * POST /api/planner/adaptive/generate
 */
export const generateAdaptivePlan = async (req, res, next) => {
  try {
    const validation = generateAdaptiveSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid adaptive plan parameters'
        }
      });
    }

    const { start_date, days, force_regenerate } = validation.data;
    const plan = await adaptivePlannerService.generateAdaptivePlan(req.user.id, {
      startDate: start_date,
      days,
      forceRegenerate: force_regenerate
    });

    return res.status(200).json({
      success: true,
      message: 'Adaptive study plan generated successfully',
      data: plan
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'ADAPTIVE_PLANNER_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Safely recalibrates future uncompleted study tasks while preserving historical records.
 * POST /api/planner/adaptive/regenerate
 */
export const regenerateAdaptivePlan = async (req, res, next) => {
  try {
    const validation = regenerateAdaptiveSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid adaptive regeneration parameters'
        }
      });
    }

    const { start_date, days } = validation.data;
    const plan = await adaptivePlannerService.regenerateAdaptivePlan(req.user.id, {
      startDate: start_date,
      days
    });

    return res.status(200).json({
      success: true,
      message: 'Adaptive study plan recalibrated successfully',
      data: plan
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'ADAPTIVE_PLANNER_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Retrieves today's adaptive study plan with real-time capacity and progress metrics.
 * GET /api/planner/adaptive/today or GET /api/planner/adaptive?date=YYYY-MM-DD
 */
export const getAdaptiveToday = async (req, res, next) => {
  try {
    const date = req.query.date;
    if (date && !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'date must be formatted as YYYY-MM-DD'
        }
      });
    }

    const todayPlan = await adaptivePlannerService.getAdaptiveToday(req.user.id, { date });
    return res.status(200).json({
      success: true,
      data: todayPlan
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'ADAPTIVE_PLANNER_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Retrieves 7-day adaptive timetable view.
 * GET /api/planner/adaptive/week?start_date=YYYY-MM-DD
 */
export const getAdaptiveWeek = async (req, res, next) => {
  try {
    const validation = getWeeklyQuerySchema.safeParse(req.query);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid start_date format'
        }
      });
    }

    const startDate = validation.data.start_date;
    const weeklyData = await adaptivePlannerService.getAdaptiveWeek(req.user.id, { startDate });

    return res.status(200).json({
      success: true,
      data: weeklyData
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'ADAPTIVE_PLANNER_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Updates a plan task status (PENDING -> IN_PROGRESS, COMPLETED, MISSED, SKIPPED).
 * PATCH /api/planner/:id/status or PATCH /api/planner/adaptive/:id/status
 */
export const updatePlanStatus = async (req, res, next) => {
  try {
    const paramValidation = uuidParamSchema.safeParse(req.params.id);
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The plan ID provided must be a valid UUID'
        }
      });
    }

    const bodyValidation = updateStatusSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      const issue = bodyValidation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid status value'
        }
      });
    }

    const updated = await adaptivePlannerService.updatePlanStatus(
      req.user.id,
      req.params.id,
      bodyValidation.data.status
    );

    return res.status(200).json({
      success: true,
      message: 'Plan status updated successfully',
      data: { plan: updated }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'PLANNER_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Returns explainable plain-English or AI-enhanced rationale for today's adaptive plan.
 * POST /api/planner/adaptive/explain or POST /api/ai/explain-adaptive-plan
 */
export const explainAdaptivePlan = async (req, res, next) => {
  try {
    const validation = explainSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request parameters'
        }
      });
    }

    const planDate = validation.data.plan_date || new Date().toISOString().split('T')[0];
    const explanation = await aiService.explainPlan(req.user.id, planDate);

    return res.status(200).json({
      success: true,
      data: explanation
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'AI_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};
