import api from './api.js';

export const topicService = {
  /**
   * Fetches topics for a subject.
   */
  async getTopics(subjectId) {
    const response = await api.get(`/subjects/${subjectId}/topics`);
    return response.data?.topics || [];
  },

  /**
   * Fetches a single topic by ID.
   */
  async getTopic(id) {
    const response = await api.get(`/topics/${id}`);
    return response.data?.topic || null;
  },

  /**
   * Creates a new topic under a subject.
   */
  async createTopic(subjectId, data) {
    const response = await api.post(`/subjects/${subjectId}/topics`, data);
    return response.data?.topic || null;
  },

  /**
   * Updates an existing topic.
   */
  async updateTopic(id, data) {
    const response = await api.put(`/topics/${id}`, data);
    return response.data?.topic || null;
  },

  /**
   * Updates progress percentage directly (e.g. quick-complete).
   */
  async updateProgress(id, completionPercentage) {
    const response = await api.patch(`/topics/${id}/progress`, {
      completion_percentage: completionPercentage
    });
    return response.data?.topic || null;
  },

  /**
   * Deletes a topic.
   */
  async deleteTopic(id) {
    const response = await api.delete(`/topics/${id}`);
    return response;
  }
};

export default topicService;
