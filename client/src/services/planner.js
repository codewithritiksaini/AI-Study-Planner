import api from './api.js';

export const plannerService = {
  /**
   * Generates a deterministic study plan for a specific date.
   * Supports forceRegenerate to safely re-plan pending tasks.
   */
  async generatePlan({ date = null, forceRegenerate = false } = {}) {
    const payload = {};
    if (date) payload.date = date;
    if (forceRegenerate) payload.force_regenerate = true;

    const response = await api.post('/planner/generate', payload);
    return response.data?.data || null;
  },

  /**
   * Retrieves today's study plan and aggregated metrics.
   */
  async getTodayPlan() {
    const response = await api.get('/planner/today');
    return response.data?.data || {
      date: new Date().toISOString().split('T')[0],
      total_planned_minutes: 0,
      completed_minutes: 0,
      pending_minutes: 0,
      available_minutes: 180,
      plans: []
    };
  },

  /**
   * Retrieves study plan for a specific date (YYYY-MM-DD).
   */
  async getPlanByDate(date) {
    const response = await api.get('/planner', {
      params: { date }
    });
    return response.data?.data || {
      date,
      total_planned_minutes: 0,
      completed_minutes: 0,
      pending_minutes: 0,
      available_minutes: 180,
      plans: []
    };
  },

  /**
   * Retrieves 7-day weekly study plan overview.
   */
  async getWeeklyPlan(startDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;

    const response = await api.get('/planner/week', { params });
    return response.data?.data || {
      start_date: startDate,
      days: []
    };
  },

  /**
   * Updates a study plan status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED).
   */
  async updateStatus(planId, status) {
    const response = await api.patch(`/planner/${planId}/status`, { status });
    return response.data?.data?.plan || null;
  }
};

export default plannerService;
