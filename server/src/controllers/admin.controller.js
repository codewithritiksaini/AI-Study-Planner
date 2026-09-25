import { adminService } from '../services/admin.service.js';

class AdminController {
  /**
   * GET /api/admin/overview
   * Returns aggregated platform metrics, system health, and DB latency.
   */
  async getOverview(req, res, next) {
    try {
      const data = await adminService.getPlatformOverview();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      console.error('Admin getOverview error:', err);
      next(err);
    }
  }

  /**
   * GET /api/admin/students
   * Returns paginated student roster with academic counters.
   */
  async getStudents(req, res, next) {
    try {
      const { limit = 50, offset = 0, search = '' } = req.query;

      const data = await adminService.getAllStudents({
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        search: String(search || '')
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      console.error('Admin getStudents error:', err);
      next(err);
    }
  }
}

export const adminController = new AdminController();
