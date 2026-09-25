import api from './api.js';

export const studyService = {
  /**
   * Starts a new study session for an authentic subject and optional topic.
   */
  async startSession({ subjectId, topicId = null }) {
    const response = await api.post('/study/start', {
      subject_id: subjectId,
      topic_id: topicId || null
    });
    return response.data?.data?.session || null;
  },

  /**
   * Fetches the currently active study session (if any).
   */
  async getActiveSession() {
    const response = await api.get('/study/active');
    return response.data?.data?.session || null;
  },

  /**
   * Completes an active study session with optional reflections.
   */
  async completeSession(sessionId, { notes = null, confidenceLevel = null, difficultyFeedback = null } = {}) {
    const response = await api.post(`/study/${sessionId}/complete`, {
      notes: notes || null,
      confidence_level: confidenceLevel || null,
      difficulty_feedback: difficultyFeedback || null
    });
    return response.data?.data?.session || null;
  },

  /**
   * Cancels an active study session without counting study duration.
   */
  async cancelSession(sessionId) {
    const response = await api.post(`/study/${sessionId}/cancel`);
    return response.data?.data?.session || null;
  },

  /**
   * Retrieves today's completed study sessions with total minutes.
   */
  async getTodaySessions() {
    const response = await api.get('/study/today');
    return response.data?.data || {
      total_minutes: 0,
      session_count: 0,
      sessions: []
    };
  },

  /**
   * Retrieves paginated previous study sessions history.
   */
  async getSessionHistory({ page = 1, limit = 20, subjectId = null } = {}) {
    const params = { page, limit };
    if (subjectId) params.subjectId = subjectId;
    const response = await api.get('/study/history', { params });
    return response.data?.data || {
      sessions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 }
    };
  },

  /**
   * Retrieves aggregated study statistics (today, this week, all-time).
   */
  async getStudySummary() {
    const response = await api.get('/study/summary');
    return response.data?.data || {
      today: { total_minutes: 0, session_count: 0 },
      this_week: { total_minutes: 0, session_count: 0 },
      all_time: { total_minutes: 0, session_count: 0 }
    };
  }
};

export default studyService;
