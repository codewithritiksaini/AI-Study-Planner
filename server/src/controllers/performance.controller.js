import { performanceService } from '../services/performance.service.js';
import { uuidParamSchema } from '../validators/quiz.validator.js';

export const getTopicPerformance = async (req, res, next) => {
  try {
    const { subject_id } = req.query;
    if (subject_id) {
      const val = uuidParamSchema.safeParse(subject_id);
      if (!val.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid subject_id parameter format'
          }
        });
      }
    }

    const topics = await performanceService.getTopicPerformance(req.user.id, subject_id || null);
    return res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicPerformanceById = async (req, res, next) => {
  try {
    const val = uuidParamSchema.safeParse(req.params.topicId);
    if (!val.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid topicId parameter format'
        }
      });
    }

    const performance = await performanceService.getTopicPerformanceById(req.user.id, req.params.topicId);
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or unauthorized'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

export const getWeakTopics = async (req, res, next) => {
  try {
    const weakTopics = await performanceService.getWeakTopics(req.user.id);
    return res.status(200).json({
      success: true,
      data: weakTopics
    });
  } catch (error) {
    next(error);
  }
};

export const getStrongTopics = async (req, res, next) => {
  try {
    const strongTopics = await performanceService.getStrongTopics(req.user.id);
    return res.status(200).json({
      success: true,
      data: strongTopics
    });
  } catch (error) {
    next(error);
  }
};
