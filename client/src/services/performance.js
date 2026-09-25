import api from './api.js';

export const performanceService = {
  /**
   * Retrieves all topic performance records for the student.
   */
  async getTopicPerformance(subjectId = null) {
    const params = subjectId ? { subject_id: subjectId } : {};
    const response = await api.get('/performance/topics', { params });
    return response.data || response || [];
  },

  /**
   * Alias for getTopicPerformance() for compatibility with Dashboard & Progress views.
   */
  async getAllTopicPerformance() {
    return this.getTopicPerformance();
  },

  /**
   * Retrieves performance details for an individual topic.
   */
  async getTopicPerformanceById(topicId) {
    const response = await api.get(`/performance/topics/${topicId}`);
    return response.data || response || null;
  },

  /**
   * Retrieves weak topics needing practice (< 70% accuracy).
   */
  async getWeakTopics() {
    const response = await api.get('/performance/weak-topics');
    return response.data || response || [];
  },

  /**
   * Retrieves mastered topics (>= 85% accuracy).
   */
  async getStrongTopics() {
    const response = await api.get('/performance/strong-topics');
    return response.data || response || [];
  }
};

export default performanceService;
