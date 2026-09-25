/**
 * recommendations.js
 *
 * Frontend API client for Phase 10: Personalized Recommendation & Smart Study Action Engine.
 * Interacts with backend /api/recommendations endpoints.
 */

import api from './api.js';

export const recommendationService = {
  /**
   * Fetches active personalized recommendations for the authenticated student.
   *
   * @param {Object} [params]
   * @param {string} [params.priority] - 'HIGH' | 'MEDIUM' | 'LOW'
   * @param {string} [params.type] - Recommendation type
   * @param {string} [params.subjectId] - UUID of subject filter
   * @param {number} [params.limit=5] - Number of recommendations to retrieve
   * @returns {Promise<Array>} List of recommendation records
   */
  async getRecommendations(params = {}) {
    const response = await api.get('/recommendations', { params });
    return response.data?.recommendations || response.data || [];
  },

  /**
   * Fetches full recommendation details by ID.
   *
   * @param {string} id - Recommendation UUID
   * @returns {Promise<Object>} Recommendation details
   */
  async getRecommendationById(id) {
    const response = await api.get(`/recommendations/${id}`);
    return response.data?.recommendation || response.data || null;
  },

  /**
   * Triggers on-demand recalculation and persistence of fresh recommendations.
   *
   * @returns {Promise<Array>} Freshly generated recommendations
   */
  async refreshRecommendations() {
    const response = await api.post('/recommendations/refresh');
    return response.data?.recommendations || response.data || [];
  },

  /**
   * Submits user feedback (HELPFUL or NOT_HELPFUL) for a recommendation.
   *
   * @param {string} id - Recommendation UUID
   * @param {'HELPFUL' | 'NOT_HELPFUL'} feedback - User satisfaction rating
   * @returns {Promise<Object>} Feedback confirmation
   */
  async submitFeedback(id, feedback) {
    const response = await api.post(`/recommendations/${id}/feedback`, { feedback });
    return response.data || response;
  },

  /**
   * Dismisses an active recommendation.
   *
   * @param {string} id - Recommendation UUID
   * @param {string} [dismissReason] - Optional reason for dismissal
   * @returns {Promise<Object>} Updated recommendation
   */
  async dismissRecommendation(id, dismissReason) {
    const response = await api.post(`/recommendations/${id}/dismiss`, { dismiss_reason: dismissReason });
    return response.data?.recommendation || response.data || null;
  },

  /**
   * Marks a recommendation as completed.
   *
   * @param {string} id - Recommendation UUID
   * @returns {Promise<Object>} Updated recommendation
   */
  async completeRecommendation(id) {
    const response = await api.post(`/recommendations/${id}/complete`);
    return response.data?.recommendation || response.data || null;
  },

  /**
   * Fetches historical recommendations (COMPLETED, DISMISSED, EXPIRED).
   *
   * @param {Object} [params]
   * @param {string} [params.status] - Filter status
   * @param {number} [params.limit=20]
   * @param {number} [params.page=1]
   * @returns {Promise<Object>} List of history items and pagination metadata
   */
  async getHistory(params = {}) {
    const response = await api.get('/recommendations/history', { params });
    return response.data || { history: [], pagination: {} };
  },

  /**
   * Fetches recommendation quality and engagement summary metrics.
   *
   * @returns {Promise<Object>} Metrics summary
   */
  async getMetricsSummary() {
    const response = await api.get('/recommendations/metrics/summary');
    return response.data?.metrics || response.data || null;
  }
};

export default recommendationService;
