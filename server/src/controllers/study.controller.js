import { z } from 'zod';
import { studyService } from '../services/study.service.js';

// ==============================================================================
// VALIDATION SCHEMAS
// ==============================================================================

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const startSessionSchema = z.object({
  subject_id: z.string({ required_error: 'subject_id is required' }).regex(uuidRegex, 'Invalid subject_id UUID format'),
  topic_id: z.string().regex(uuidRegex, 'Invalid topic_id UUID format').nullable().optional()
});

const completeSessionSchema = z.object({
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
  confidence_level: z.number().int().min(1, 'Confidence level must be between 1 and 5').max(5, 'Confidence level must be between 1 and 5').nullable().optional(),
  difficulty_feedback: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: "difficulty_feedback must be 'EASY', 'MEDIUM', or 'HARD'" })
  }).nullable().optional()
});

const uuidParamSchema = z.string().regex(uuidRegex, 'Invalid ID format; must be a valid UUID');

// ==============================================================================
// CONTROLLER HANDLERS
// ==============================================================================

/**
 * Starts a new study session for the authenticated user.
 * POST /api/study/start
 */
export const startSession = async (req, res, next) => {
  try {
    const validation = startSessionSchema.safeParse(req.body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid session start parameters'
        }
      });
    }

    const { subject_id, topic_id } = validation.data;
    const session = await studyService.startSession(req.user.id, {
      subjectId: subject_id,
      topicId: topic_id
    });

    return res.status(201).json({
      success: true,
      message: 'Study session started successfully',
      data: { session }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'STUDY_SESSION_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Retrieves the currently active study session for the authenticated user.
 * GET /api/study/active
 */
export const getActiveSession = async (req, res, next) => {
  try {
    const session = await studyService.getActiveSession(req.user.id);

    return res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Completes an active study session.
 * POST /api/study/:id/complete
 */
export const completeSession = async (req, res, next) => {
  try {
    const paramValidation = uuidParamSchema.safeParse(req.params.id);
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The session ID provided must be a valid UUID'
        }
      });
    }

    const bodyValidation = completeSessionSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      const issue = bodyValidation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid completion reflection parameters'
        }
      });
    }

    const completed = await studyService.completeSession(
      req.user.id,
      req.params.id,
      bodyValidation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Study session completed successfully',
      data: { session: completed }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'STUDY_SESSION_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Cancels an active study session.
 * POST /api/study/:id/cancel
 */
export const cancelSession = async (req, res, next) => {
  try {
    const paramValidation = uuidParamSchema.safeParse(req.params.id);
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The session ID provided must be a valid UUID'
        }
      });
    }

    const cancelled = await studyService.cancelSession(req.user.id, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Study session cancelled',
      data: { session: cancelled }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'STUDY_SESSION_ERROR',
          message: error.message
        }
      });
    }
    next(error);
  }
};

/**
 * Retrieves today's completed study sessions with aggregated metrics.
 * GET /api/study/today
 */
export const getTodaySessions = async (req, res, next) => {
  try {
    const data = await studyService.getTodaySessions(req.user.id);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves paginated study session history.
 * GET /api/study/history
 */
export const getSessionHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const subjectId = req.query.subjectId && uuidRegex.test(req.query.subjectId) ? req.query.subjectId : null;

    const data = await studyService.getSessionHistory(req.user.id, {
      page,
      limit,
      subjectId
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves summary metrics for the study sessions.
 * GET /api/study/summary
 */
export const getStudySummary = async (req, res, next) => {
  try {
    const summary = await studyService.getStudySummary(req.user.id);

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves single study session by ID.
 * GET /api/study/:id
 */
export const getSessionById = async (req, res, next) => {
  try {
    const paramValidation = uuidParamSchema.safeParse(req.params.id);
    if (!paramValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The session ID provided must be a valid UUID'
        }
      });
    }

    const session = await studyService.getSessionById(req.params.id, req.user.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Study session not found or access denied.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};
