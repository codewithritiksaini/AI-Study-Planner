import api from './api.js';

export const adminService = {
  /**
   * Retrieves platform-wide metrics, counters, and system health status.
   */
  async getOverview() {
    const res = await api.get('/admin/overview', { skipCache: true });
    return res.data || res;
  },

  /**
   * Retrieves paginated student roster with academic statistics and filters.
   */
  async getStudents({ limit = 50, offset = 0, search = '', role = 'all', status = 'all', branch = '', semester = '' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (offset !== undefined && offset !== null) params.set('offset', offset);
    if (search) params.set('search', search);
    if (role && role !== 'all') params.set('role', role);
    if (status && status !== 'all') params.set('status', status);
    if (branch && branch !== 'all') params.set('branch', branch);
    if (semester && semester !== 'all') params.set('semester', semester);

    const res = await api.get(`/admin/students?${params.toString()}`, { skipCache: true });
    return res.data || res;
  },

  /**
   * Retrieves comprehensive student dossier including enrolled subjects & study history.
   */
  async getStudentById(id) {
    if (!id) return null;
    const res = await api.get(`/admin/students/${id}`, { skipCache: true });
    return res.data || res;
  },

  /**
   * Toggles active / inactive state for a student account.
   */
  async updateStudentStatus(id, isActive) {
    if (!id) return null;
    const res = await api.patch(`/admin/students/${id}/status`, { is_active: isActive });
    return res.data || res;
  },

  /**
   * Permanently deletes a student account and all academic data.
   */
  async deleteStudent(id) {
    if (!id) return null;
    const res = await api.delete(`/admin/students/${id}`);
    return res.data || res;
  }
};

export default adminService;
