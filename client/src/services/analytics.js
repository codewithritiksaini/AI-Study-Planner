/**
 * analytics.js
 *
 * Frontend API client for Phase 9: Student Intelligence, Analytics & Insights.
 * Communicates with backend /api/analytics endpoints.
 */

import api from './api.js';

export const analyticsService = {
  /**
   * Retrieves high-performance aggregated overview for dashboard initial load.
   *
   * @param {number} [days=30] - Lookback range in calendar days (7, 14, 30, 90)
   * @returns {Promise<Object>} Aggregated analytics overview
   */
  async getOverview(days = 30) {
    const response = await api.get('/analytics/overview', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves study session metrics (total hours, active days, consistency, streaks, daily series).
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getStudyAnalytics(days = 30) {
    const response = await api.get('/analytics/study', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves syllabus completion and academic metrics.
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getAcademicAnalytics(days = 30) {
    const response = await api.get('/analytics/academic', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves quiz assessment analytics (average score, recent vs historical, trend, trajectory).
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getQuizAnalytics(days = 30) {
    const response = await api.get('/analytics/quiz', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves study plan adherence, planned vs actual duration, and status distributions.
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getPlannerAnalytics(days = 30) {
    const response = await api.get('/analytics/planner', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves chronological daily trend series for charts (study, quiz, and planner).
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getTrends(days = 30) {
    const response = await api.get('/analytics/trends', { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves prioritized, deduplicated deterministic educational insights.
   *
   * @param {number} [days=30]
   * @returns {Promise<Array<Object>>}
   */
  async getInsights(days = 30) {
    const response = await api.get('/analytics/insights', { params: { days } });
    return response.data?.data || response.data || [];
  },

  /**
   * Retrieves comprehensive progress, study, and quiz breakdown for a single subject.
   *
   * @param {string} subjectId - UUID
   * @param {number} [days=30]
   * @returns {Promise<Object>}
   */
  async getSubjectAnalytics(subjectId, days = 30) {
    const response = await api.get(`/analytics/subjects/${subjectId}`, { params: { days } });
    return response.data?.data || response.data || null;
  },

  /**
   * Retrieves detailed performance, past attempts, and focus duration for a single topic.
   *
   * @param {string} topicId - UUID
   * @returns {Promise<Object>}
   */
  async getTopicAnalytics(topicId) {
    const response = await api.get(`/analytics/topics/${topicId}`);
    return response.data?.data || response.data || null;
  },

  /**
   * Requests an optional natural-language summary and synthesis of insights from Gemini.
   * Falls back to deterministic rule-based text if Gemini is disabled or errors out.
   *
   * @param {number} [days=30]
   * @returns {Promise<Object>} { summary, insights, source }
   */
  async explainInsights(days = 30) {
    const response = await api.post('/analytics/explain-insights', { days });
    return response.data?.data || response.data || null;
  }
};

export default analyticsService;
