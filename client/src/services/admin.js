import api from './api.js';

export const adminService = {
  /**
   * Retrieves platform-wide metrics, counters, and system health status.
   */
  async getOverview() {
    const res = await api.get('/admin/overview');
    return res.data || res;
  },

  /**
   * Retrieves paginated student roster with academic statistics.
   */
  async getStudents({ limit = 50, offset = 0, search = '' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);
    if (search) params.set('search', search);

    const res = await api.get(`/admin/students?${params.toString()}`);
    return res.data || res;
  }
};

export default adminService;
