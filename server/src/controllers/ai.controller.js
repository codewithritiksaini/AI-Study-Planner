import { z } from 'zod';
import { aiService } from '../services/ai.service.js';
import { AI_CONFIG } from '../config/ai.config.js';

// ==============================================================================
// VALIDATION SCHEMAS
// ==============================================================================

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const recommendationSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD').optional()
});

const explainPlanSchema = z.object({
  plan_date: z.string().regex(dateRegex, 'plan_date must be formatted as YYYY-MM-DD').optional()
});

const studyStrategySchema = z.object({
  topic_id: z.string({ required_error: 'topic_id is required' }).regex(uuidRegex, 'Invalid topic_id format; must be a valid UUID')
});

const askAISchema = z.object({
  message: z.string({ required_error: 'message is required' })
    .min(2, 'Message must be at least 2 characters')
    .max(AI_CONFIG.constraints.maxAskMessageLength, `Message cannot exceed ${AI_CONFIG.constraints.maxAskMessageLength} characters`)
});

const suggestTopicsSchema = z.object({
  subject_name: z.string({ required_error: 'subject_name is required' }).trim().min(2, 'Subject name must be at least 2 characters').max(150, 'Subject name cannot exceed 150 characters'),
  existing_topics: z.array(z.string().trim()).optional().default([])
});

const topicStudyGuideSchema = z.object({
  topic_id: z.string().regex(uuidRegex, 'Invalid topic_id format; must be a valid UUID').optional().nullable(),
  subject_id: z.string().regex(uuidRegex, 'Invalid subject_id format; must be a valid UUID').optional().nullable(),
  estimated_minutes: z.number().int().min(5).max(180).optional().nullable()
});

// ==============================================================================
// CONTROLLER HANDLERS
// ==============================================================================

/**
 * Retrieves personalized daily study recommendations from Gemini.
 * POST /api/ai/recommendation
 */
export const getRecommendation = async (req, res, next) => {
  try {
    const validation = recommendationSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload'
        }
      });
    }

    const { date } = validation.data;
    const data = await aiService.getStudyRecommendation(req.user.id, date);

    return res.status(200).json({
      success: true,
      data
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

/**
 * Returns a natural-language explanation of why today's plan was prioritized.
 * POST /api/ai/explain-plan
 */
export const explainPlan = async (req, res, next) => {
  try {
    const validation = explainPlanSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload'
        }
      });
    }

    const { plan_date } = validation.data;
    const data = await aiService.explainPlan(req.user.id, plan_date);

    return res.status(200).json({
      success: true,
      data
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

/**
 * Generates a tactical 45-60 min step-by-step study roadmap for a topic.
 * POST /api/ai/study-strategy
 */
export const getStudyStrategy = async (req, res, next) => {
  try {
    const validation = studyStrategySchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid topic_id'
        }
      });
    }

    const { topic_id } = validation.data;
    const data = await aiService.getStudyStrategy(req.user.id, topic_id);

    return res.status(200).json({
      success: true,
      data
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

/**
 * Answers a student study query grounded in current timetable context.
 * POST /api/ai/ask
 */
export const askAI = async (req, res, next) => {
  try {
    const validation = askAISchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid query message'
        }
      });
    }

    const { message } = validation.data;
    const data = await aiService.askAI(req.user.id, message);

    return res.status(200).json({
      success: true,
      data
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

/**
 * Suggests curriculum topics based on subject name.
 * POST /api/ai/suggest-topics
 */
export const suggestTopics = async (req, res, next) => {
  try {
    const validation = suggestTopicsSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload'
        }
      });
    }

    const { subject_name, existing_topics } = validation.data;
    const data = await aiService.suggestTopicsForSubject(subject_name, existing_topics);

    return res.status(200).json({
      success: true,
      data
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

/**
 * Generates an interactive, time-budgeted study companion for a topic.
 * POST /api/ai/topic-guide
 */
export const getTopicStudyGuide = async (req, res, next) => {
  try {
    const validation = topicStudyGuideSchema.safeParse(req.body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid study guide request parameters'
        }
      });
    }

    const { topic_id, subject_id, estimated_minutes } = validation.data;
    const guide = await aiService.getTopicStudyGuide(req.user.id, {
      topicId: topic_id,
      subjectId: subject_id,
      estimatedMinutes: estimated_minutes
    });

    return res.status(200).json({
      success: true,
      data: guide
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
