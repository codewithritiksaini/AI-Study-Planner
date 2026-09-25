import { topicService } from '../services/topic.service.js';
import { z } from 'zod';

const createTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Topic name is required' })
    .max(150, { message: 'Topic name cannot exceed 150 characters' }),
  description: z
    .string()
    .trim()
    .max(1000, { message: 'Description cannot exceed 1000 characters' })
    .optional()
    .nullable(),
  difficulty: z
    .enum(['EASY', 'MEDIUM', 'HARD'], {
      errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' })
    })
    .default('MEDIUM'),
  estimated_minutes: z
    .number()
    .int({ message: 'Estimated minutes must be an integer' })
    .min(1, { message: 'Estimated study time must be at least 1 minute' })
    .max(1440, { message: 'Estimated study time cannot exceed 1440 minutes (24 hours)' })
    .default(60),
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  completion_percentage: z
    .number()
    .min(0, { message: 'Completion percentage cannot be negative' })
    .max(100, { message: 'Completion percentage cannot exceed 100%' })
    .default(0.00)
});

const updateTopicSchema = createTopicSchema.partial();

const updateProgressSchema = z.object({
  completion_percentage: z
    .number()
    .min(0, { message: 'Completion percentage cannot be negative' })
    .max(100, { message: 'Completion percentage cannot exceed 100%' })
});

export const getTopicsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const topics = await topicService.getTopicsBySubjectId(subjectId, req.user.id);

    if (topics === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBJECT_NOT_FOUND',
          message: 'Subject not found or you do not have permission to access it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        topics
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const topic = await topicService.getTopicById(id, req.user.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or you do not have permission to view it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        topic
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const payload = { ...req.body };
    if (payload.estimated_minutes !== undefined && typeof payload.estimated_minutes === 'string') {
      payload.estimated_minutes = parseInt(payload.estimated_minutes, 10);
    }
    if (payload.completion_percentage !== undefined && typeof payload.completion_percentage === 'string') {
      payload.completion_percentage = parseFloat(payload.completion_percentage);
    }

    const validation = createTopicSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid topic data',
          details: validation.error.format()
        }
      });
    }

    try {
      const created = await topicService.createTopic(subjectId, req.user.id, validation.data);

      if (!created) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBJECT_NOT_FOUND',
            message: 'Parent subject not found or you do not have permission to add topics to it.'
          }
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Topic created successfully',
        data: {
          topic: created
        }
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TOPIC_NAME',
            message: `A topic named "${validation.data.name}" already exists in this subject.`
          }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.body.id || req.body.subject_id || req.body.created_at) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FORBIDDEN_FIELD_MUTATION',
          message: 'Directly modifying id, subject_id, or created_at is not permitted.'
        }
      });
    }

    const payload = { ...req.body };
    if (payload.estimated_minutes !== undefined && typeof payload.estimated_minutes === 'string') {
      payload.estimated_minutes = parseInt(payload.estimated_minutes, 10);
    }
    if (payload.completion_percentage !== undefined && typeof payload.completion_percentage === 'string') {
      payload.completion_percentage = parseFloat(payload.completion_percentage);
    }

    const validation = updateTopicSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid topic data'
        }
      });
    }

    try {
      const updated = await topicService.updateTopic(id, req.user.id, validation.data);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TOPIC_NOT_FOUND',
            message: 'Topic not found or you do not have permission to edit it.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Topic updated successfully',
        data: {
          topic: updated
        }
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_TOPIC_NAME',
            message: `A topic named "${validation.data.name}" already exists in this subject.`
          }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

export const updateTopicProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.completion_percentage !== undefined && typeof payload.completion_percentage === 'string') {
      payload.completion_percentage = parseFloat(payload.completion_percentage);
    }

    const validation = updateProgressSchema.safeParse(payload);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Completion percentage must be a number between 0 and 100.'
        }
      });
    }

    const updated = await topicService.updateTopicProgress(
      id,
      req.user.id,
      validation.data.completion_percentage
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or you do not have permission to update it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Topic progress updated successfully',
      data: {
        topic: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await topicService.deleteTopic(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or you do not have permission to delete it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Topic "${deleted.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};
