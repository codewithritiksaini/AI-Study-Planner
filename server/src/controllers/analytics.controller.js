/**
 * analytics.controller.js
 *
 * REST API Controller for Phase 9: Student Intelligence, Analytics & Insights.
 * Enforces Zod parameter validation, error mapping, and user tenancy.
 */

import { analyticsService } from '../services/analytics/analytics.service.js';
import {
  analyticsQuerySchema,
  subjectAnalyticsParamsSchema,
  topicAnalyticsParamsSchema
} from '../validators/analytics.validator.js';

class AnalyticsController {
  /**
   * GET /api/analytics/overview?days=30
   */
  async getOverview(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getOverview({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/study?days=30
   */
  async getStudyAnalytics(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getStudyAnalytics({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/academic?days=30
   */
  async getAcademicAnalytics(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getAcademicAnalytics({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/quiz?days=30
   */
  async getQuizAnalytics(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getQuizAnalytics({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/planner?days=30
   */
  async getPlannerAnalytics(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getPlannerAnalytics({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/trends?days=30
   */
  async getTrends(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getTrends({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/insights?days=30
   */
  async getInsights(req, res, next) {
    try {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_RANGE',
            message: parsed.error.errors[0]?.message || 'Invalid analytics time range'
          }
        });
      }

      const data = await analyticsService.getInsights({
        userId: req.user.id,
        days: parsed.data.days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/subjects/:subjectId?days=30
   */
  async getSubjectAnalytics(req, res, next) {
    try {
      const paramCheck = subjectAnalyticsParamsSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SUBJECT_ID',
            message: paramCheck.error.errors[0]?.message || 'Invalid subject ID'
          }
        });
      }

      const queryCheck = analyticsQuerySchema.safeParse(req.query);
      const days = queryCheck.success ? queryCheck.data.days : 30;

      const data = await analyticsService.getSubjectAnalytics({
        userId: req.user.id,
        subjectId: req.params.subjectId,
        days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      if (err.code === 'SUBJECT_ANALYTICS_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        });
      }
      next(err);
    }
  }

  /**
   * GET /api/analytics/topics/:topicId
   */
  async getTopicAnalytics(req, res, next) {
    try {
      const paramCheck = topicAnalyticsParamsSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOPIC_ID',
            message: paramCheck.error.errors[0]?.message || 'Invalid topic ID'
          }
        });
      }

      const data = await analyticsService.getTopicAnalytics({
        userId: req.user.id,
        topicId: req.params.topicId
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      if (err.code === 'TOPIC_ANALYTICS_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        });
      }
      next(err);
    }
  }

  /**
   * POST /api/analytics/explain-insights
   */
  async explainInsights(req, res, next) {
    try {
      const days = [7, 14, 30, 90].includes(Number(req.body.days)) ? Number(req.body.days) : 30;
      const data = await analyticsService.explainInsights({
        userId: req.user.id,
        days
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
export default analyticsController;
