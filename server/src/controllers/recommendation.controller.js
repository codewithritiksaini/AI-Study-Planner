/**
 * recommendation.controller.js
 *
 * REST API Controller for Phase 10: Personalized Study Recommendation Engine.
 */

import { recommendationEngineService } from '../services/recommendations/recommendation-engine.service.js';
import { recommendationLifecycleService } from '../services/recommendations/recommendation-lifecycle.service.js';
import {
  getRecommendationsQuerySchema,
  recommendationIdParamSchema,
  recommendationFeedbackSchema,
  refreshRecommendationsSchema
} from '../validators/recommendation.validator.js';

export class RecommendationController {
  /**
   * GET /api/recommendations
   * Retrieves active study recommendations for the authenticated student.
   */
  async getRecommendations(req, res) {
    try {
      const parsed = getRecommendationsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid query parameters',
            details: parsed.error.issues
          }
        });
      }

      const userId = req.user.id;
      const recommendations = await recommendationEngineService.getRecommendations(userId, parsed.data);

      return res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: 'An error occurred while retrieving study recommendations.'
        }
      });
    }
  }

  /**
   * GET /api/recommendations/:id
   * Retrieves detailed view of a specific recommendation.
   */
  async getRecommendationById(req, res) {
    try {
      const parsed = recommendationIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid recommendation ID'
          }
        });
      }

      const userId = req.user.id;
      const recommendation = await recommendationLifecycleService.getRecommendationById(userId, parsed.data.id);

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recommendation not found or access denied.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        recommendation
      });
    } catch (error) {
      console.error('Error fetching recommendation by ID:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: 'An error occurred while retrieving recommendation details.'
        }
      });
    }
  }

  /**
   * POST /api/recommendations/refresh
   * Forces regeneration of fresh recommendations directly from latest analytics.
   */
  async refreshRecommendations(req, res) {
    try {
      const parsed = refreshRecommendationsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid refresh parameters'
          }
        });
      }

      const userId = req.user.id;
      const recommendations = await recommendationEngineService.refreshRecommendations(userId, parsed.data);

      return res.status(200).json({
        success: true,
        message: 'Recommendations refreshed successfully.',
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'RECOMMENDATION_REFRESH_ERROR',
          message: 'Failed to refresh recommendations from latest data.'
        }
      });
    }
  }

  /**
   * POST /api/recommendations/:id/feedback
   * Records student feedback (HELPFUL, NOT_HELPFUL, DISMISS, COMPLETED).
   */
  async submitFeedback(req, res) {
    try {
      const paramParsed = recommendationIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: paramParsed.error.issues[0]?.message || 'Invalid recommendation ID'
          }
        });
      }

      const bodyParsed = recommendationFeedbackSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: bodyParsed.error.issues[0]?.message || 'Invalid feedback value'
          }
        });
      }

      const userId = req.user.id;
      const result = await recommendationLifecycleService.recordFeedback(
        userId,
        paramParsed.data.id,
        bodyParsed.data.feedback
      );

      return res.status(200).json({
        success: true,
        message: 'Feedback recorded successfully.',
        data: result
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }

      console.error('Error recording feedback:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_ERROR',
          message: 'Failed to record feedback.'
        }
      });
    }
  }

  /**
   * POST /api/recommendations/:id/dismiss
   * Dismisses an active recommendation.
   */
  async dismissRecommendation(req, res) {
    try {
      const parsed = recommendationIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid recommendation ID'
          }
        });
      }

      const userId = req.user.id;
      const updated = await recommendationLifecycleService.updateStatus(userId, parsed.data.id, 'DISMISSED');

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recommendation not found or access denied.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Recommendation dismissed successfully.',
        recommendation: updated
      });
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DISMISS_ERROR',
          message: 'Failed to dismiss recommendation.'
        }
      });
    }
  }

  /**
   * POST /api/recommendations/:id/complete
   * Marks an active recommendation as completed.
   */
  async completeRecommendation(req, res) {
    try {
      const parsed = recommendationIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid recommendation ID'
          }
        });
      }

      const userId = req.user.id;
      const updated = await recommendationLifecycleService.updateStatus(userId, parsed.data.id, 'COMPLETED');

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recommendation not found or access denied.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Recommendation marked as completed.',
        recommendation: updated
      });
    } catch (error) {
      console.error('Error completing recommendation:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'COMPLETE_ERROR',
          message: 'Failed to mark recommendation as completed.'
        }
      });
    }
  }

  /**
   * GET /api/recommendations/history
   * Retrieves past completed, dismissed, or expired recommendations.
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = Number(req.query.limit) || 20;
      const history = await recommendationLifecycleService.getHistory(userId, { limit });

      return res.status(200).json({
        success: true,
        count: history.length,
        history
      });
    } catch (error) {
      console.error('Error fetching recommendation history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'HISTORY_ERROR',
          message: 'Failed to retrieve recommendation history.'
        }
      });
    }
  }

  /**
   * GET /api/recommendations/metrics/summary
   * Returns system quality & completion statistics.
   */
  async getMetricsSummary(req, res) {
    try {
      const userId = req.user.id;
      const stats = await recommendationLifecycleService.getRecommendationStats(userId);

      return res.status(200).json({
        success: true,
        metrics: stats
      });
    } catch (error) {
      console.error('Error fetching recommendation stats:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve recommendation statistics.'
        }
      });
    }
  }
}

export const recommendationController = new RecommendationController();
export default recommendationController;
