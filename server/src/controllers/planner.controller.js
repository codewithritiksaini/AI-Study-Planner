import { z } from 'zod';
import { plannerService } from '../services/planner.service.js';
import { PLANNER_CONFIG } from '../config/planner.config.js';

// ==============================================================================
// VALIDATION SCHEMAS
// ==============================================================================

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const generatePlanSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD').optional(),
  force_regenerate: z.boolean().optional()
});

const getPlanQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD').optional()
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

const uuidParamSchema = z.string().regex(uuidRegex, 'Invalid plan ID; must be a valid UUID');

// ==============================================================================
// CONTROLLER HANDLERS
// ==============================================================================

/**
 * Generates a deterministic study plan for a date.
 * POST /api/planner/generate
 */
export const generatePlan = async (req, res, next) => {
  try {
    const validation = generatePlanSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid plan generation parameters'
        }
      });
    }

    const { date, force_regenerate } = validation.data;
    const plan = await plannerService.generatePlan(req.user.id, {
      date,
      forceRegenerate: force_regenerate
    });

    return res.status(200).json({
      success: true,
      message: 'Study plan generated successfully',
      data: plan
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
 * Retrieves today's study plan with summary metrics.
 * GET /api/planner/today
 */
export const getTodayPlan = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const plan = await plannerService.getPlansByDate(req.user.id, todayStr);

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves study plan for a specific date.
 * GET /api/planner?date=YYYY-MM-DD
 */
export const getPlanByDate = async (req, res, next) => {
  try {
    const validation = getPlanQuerySchema.safeParse(req.query);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid date format'
        }
      });
    }

    const date = validation.data.date || new Date().toISOString().split('T')[0];
    const plan = await plannerService.getPlansByDate(req.user.id, date);

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves 7-day weekly study plan overview.
 * GET /api/planner/week?start_date=YYYY-MM-DD
 */
export const getWeeklyPlan = async (req, res, next) => {
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

    const startDate = validation.data.start_date || new Date().toISOString().split('T')[0];
    const weeklyData = await plannerService.getWeeklyPlan(req.user.id, startDate);

    return res.status(200).json({
      success: true,
      data: weeklyData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a plan task status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED).
 * PATCH /api/planner/:id/status
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

    const updated = await plannerService.updatePlanStatus(
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
