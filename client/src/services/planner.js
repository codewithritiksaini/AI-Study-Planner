import api from './api.js';

export const plannerService = {
  // ============================================================================
  // PHASE 8: ADAPTIVE STUDY PLANNER API
  // ============================================================================

  /**
   * Generates an intelligent, feedback-driven adaptive study plan.
   * Multi-day scheduling based on quiz performance, exam urgency, syllabus completion,
   * inactivity, difficulty, and missed task pressure.
   */
  async generateAdaptivePlan({ startDate = null, days = 7, forceRegenerate = false } = {}) {
    const payload = {};
    if (startDate) payload.start_date = startDate;
    if (days) payload.days = days;
    if (forceRegenerate) payload.force_regenerate = true;

    const response = await api.post('/planner/adaptive/generate', payload);
    return response.data?.data || null;
  },

  /**
   * Safely recalibrates future uncompleted study tasks while preserving historical records.
   */
  async regenerateAdaptivePlan({ startDate = null, days = 7 } = {}) {
    const payload = {};
    if (startDate) payload.start_date = startDate;
    if (days) payload.days = days;

    const response = await api.post('/planner/adaptive/regenerate', payload);
    return response.data?.data || null;
  },

  /**
   * Retrieves today's adaptive study plan and real-time capacity metrics.
   * Can also accept an optional date string (YYYY-MM-DD).
   */
  async getAdaptiveToday({ date = null } = {}) {
    const params = {};
    if (date) params.date = date;

    const response = await api.get('/planner/adaptive/today', { params });
    return response.data?.data || {
      date: date || new Date().toISOString().split('T')[0],
      capacity_minutes: 120,
      planned_minutes: 0,
      completed_minutes: 0,
      pending_minutes: 0,
      remaining_capacity: 120,
      tasks: []
    };
  },

  /**
   * Retrieves adaptive study plan for a specific date (YYYY-MM-DD).
   */
  async getAdaptivePlanByDate(date) {
    return this.getAdaptiveToday({ date });
  },

  /**
   * Retrieves 7-day adaptive timetable view.
   */
  async getAdaptiveWeek(startDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;

    const response = await api.get('/planner/adaptive/week', { params });
    return response.data?.data || {
      start_date: startDate || new Date().toISOString().split('T')[0],
      total_planned_minutes: 0,
      total_completed_minutes: 0,
      days: []
    };
  },

  /**
   * Explains why tasks were prioritized in the adaptive plan.
   */
  async explainAdaptivePlan(planDate = null) {
    const payload = {};
    if (planDate) payload.plan_date = planDate;
    const response = await api.post('/planner/adaptive/explain', payload);
    return response.data?.data || null;
  },

  // ============================================================================
  // PHASE 11: INTELLIGENT ADAPTIVE STUDY SCHEDULING API
  // ============================================================================

  /**
   * Retrieves daily timeline schedule with time slots, capacity calculation,
   * overload indicators, and explainability bullets.
   */
  async getDailySchedule({ date = null } = {}) {
    const params = {};
    if (date) params.date = date;
    const response = await api.get('/planner/daily', { params });
    return response.data?.data || null;
  },

  /**
   * Retrieves multi-day weekly timetable with day-by-day session distribution.
   */
  async getWeeklyTimetable({ startDate = null } = {}) {
    const params = {};
    if (startDate) params.start_date = startDate;
    const response = await api.get('/planner/weekly', { params });
    return response.data?.data || null;
  },

  /**
   * Retrieves recurring weekly study availability windows.
   */
  async getAvailability() {
    const response = await api.get('/planner/availability');
    return response.data?.data?.availability || [];
  },

  /**
   * Creates a recurring weekly study availability window.
   */
  async createAvailability(payload) {
    const response = await api.post('/planner/availability', payload);
    return response.data?.data?.availability || null;
  },

  /**
   * Updates an existing availability window.
   */
  async updateAvailability(id, payload) {
    const response = await api.put(`/planner/availability/${id}`, payload);
    return response.data?.data?.availability || null;
  },

  /**
   * Deletes an availability window.
   */
  async deleteAvailability(id) {
    const response = await api.delete(`/planner/availability/${id}`);
    return response.data?.data || null;
  },

  /**
   * Retrieves student's blocked periods.
   */
  async getBlockedPeriods() {
    const response = await api.get('/planner/blocked-periods');
    return response.data?.data?.blocked_periods || [];
  },

  /**
   * Creates a blocked time period (recurring or specific date).
   */
  async createBlockedPeriod(payload) {
    const response = await api.post('/planner/blocked-periods', payload);
    return response.data?.data?.blocked_period || null;
  },

  /**
   * Deletes a blocked period.
   */
  async deleteBlockedPeriod(id) {
    const response = await api.delete(`/planner/blocked-periods/${id}`);
    return response.data?.data || null;
  },

  /**
   * Generates a non-destructive plan preview with candidate sessions,
   * overload calculations, and unscheduled task breakdown.
   */
  async generatePreview(payload = {}) {
    const response = await api.post('/planner/preview', payload);
    return response.data?.data || null;
  },

  /**
   * Persists a previewed plan into active schedule, preserving locked sessions.
   */
  async applyPlan(payload) {
    const response = await api.post('/planner/apply', payload);
    return response.data?.data || null;
  },

  /**
   * Toggles lock on an individual session.
   */
  async toggleLock(sessionId) {
    const response = await api.post(`/planner/sessions/${sessionId}/lock`);
    return response.data?.data || null;
  },

  /**
   * Targeted reschedule for a missed study session.
   */
  async rescheduleSession(sessionId) {
    const response = await api.post(`/planner/sessions/${sessionId}/reschedule`);
    return response.data?.data || null;
  },

  /**
   * Creates a manual custom study session.
   */
  async createManualSession(payload) {
    const response = await api.post('/planner/sessions', payload);
    return response.data?.data?.session || null;
  },

  /**
   * Deletes a study session.
   */
  async deleteSession(sessionId) {
    const response = await api.delete(`/planner/sessions/${sessionId}`);
    return response.data?.data || null;
  },

  // ============================================================================
  // SHARED & BACKWARD-COMPATIBLE ENDPOINTS
  // ============================================================================

  /**
   * Updates a study plan status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED, MISSED).
   */
  async updateStatus(planId, status) {
    const response = await api.patch(`/planner/${planId}/status`, { status });
    return response.data?.data?.plan || null;
  },

  /**
   * Legacy Phase 5 deterministic generator.
   */
  async generatePlan({ date = null, forceRegenerate = false } = {}) {
    const payload = {};
    if (date) payload.date = date;
    if (forceRegenerate) payload.force_regenerate = true;

    const response = await api.post('/planner/generate', payload);
    return response.data?.data || null;
  },

  /**
   * Legacy Phase 5 today view.
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
   * Legacy Phase 5 date view.
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
   * Legacy Phase 5 weekly plan overview.
   */
  async getWeeklyPlan(startDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;

    const response = await api.get('/planner/week', { params });
    return response.data?.data || {
      start_date: startDate,
      days: []
    };
  }
};

export default plannerService;
