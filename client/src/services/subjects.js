import api from './api.js';

export const subjectService = {
  /**
   * Fetches all subjects for the authenticated user.
   */
  async getSubjects() {
    const response = await api.get('/subjects');
    return response.data?.subjects || [];
  },

  /**
   * Fetches single subject with its topics and syllabus progress.
   */
  async getSubject(id) {
    const response = await api.get(`/subjects/${id}`);
    return response.data?.subject || null;
  },

  /**
   * Fetches academic summary for dashboard.
   */
  async getDashboardSummary() {
    const response = await api.get('/subjects/summary');
    return response.data?.data || {
      totalSubjects: 0,
      totalTopics: 0,
      overallSyllabusProgress: 0,
      upcomingExam: null
    };
  },

  /**
   * Creates a new subject.
   */
  async createSubject(data) {
    const response = await api.post('/subjects', data);
    return response.data?.subject || null;
  },

  /**
   * Updates an existing subject.
   */
  async updateSubject(id, data) {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data?.subject || null;
  },

  /**
   * Deletes a subject (cascades to all associated topics).
   */
  async deleteSubject(id) {
    const response = await api.delete(`/subjects/${id}`);
    return response;
  }
};

export default subjectService;
