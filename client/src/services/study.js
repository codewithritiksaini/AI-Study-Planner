import api from './api.js';

export const studyService = {
  /**
   * Starts a new study session for an authentic subject and optional topic.
   */
  async startSession({ subjectId, topicId = null }) {
    const res = await api.post('/study/start', {
      subject_id: subjectId,
      topic_id: topicId || null
    });
    return res?.data?.session || res?.session || res || null;
  },

  /**
   * Fetches the currently active study session (if any).
   */
  async getActiveSession() {
    const res = await api.get('/study/active');
    return res?.data?.session || res?.session || null;
  },

  /**
   * Completes an active study session with optional reflections.
   */
  async completeSession(sessionId, reflection = {}) {
    const notes = reflection.notes || null;
    const confidence_level = reflection.confidence_level ?? reflection.confidenceLevel ?? null;
    const difficulty_feedback = reflection.difficulty_feedback ?? reflection.difficultyFeedback ?? null;
    const res = await api.post(`/study/${sessionId}/complete`, {
      notes,
      confidence_level,
      difficulty_feedback
    });
    return res?.data?.session || res?.session || res || null;
  },

  /**
   * Cancels an active study session without counting study duration.
   */
  async cancelSession(sessionId) {
    const res = await api.post(`/study/${sessionId}/cancel`);
    return res?.data?.session || res?.session || res || null;
  },

  /**
   * Retrieves today's completed study sessions with total minutes.
   */
  async getTodaySessions() {
    const res = await api.get('/study/today');
    return res?.data || res || {
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
    const res = await api.get('/study/history', { params });
    return res?.data || res || {
      sessions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 }
    };
  },

  /**
   * Retrieves aggregated study statistics (today, this week, all-time).
   */
  async getStudySummary() {
    const res = await api.get('/study/summary');
    return res?.data || res || {
      today: { total_minutes: 0, session_count: 0 },
      this_week: { total_minutes: 0, session_count: 0 },
      all_time: { total_minutes: 0, session_count: 0 }
    };
  }
};

export default studyService;
