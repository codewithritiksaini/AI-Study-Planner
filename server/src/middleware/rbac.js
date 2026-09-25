import { query } from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * RBAC Middleware: requireAdmin
 * Ensures the authenticated user has the 'admin' role.
 * Must be mounted AFTER requireAuth middleware.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before accessing admin resources.'
        }
      });
    }

    // 1. If role is explicitly 'admin' in validated token
    if (req.user.role === 'admin') {
      return next();
    }

    // 2. If role is explicitly 'student' or anything other than admin
    if (req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Platform administrator privileges required.'
        }
      });
    }

    // 3. Fallback: if role was not attached to token, check live DB profile
    if (UUID_REGEX.test(req.user.id)) {
      const profileRes = await query(
        `SELECT role FROM public.profiles WHERE id = $1 LIMIT 1;`,
        [req.user.id]
      );

      const liveRole = profileRes.rows[0]?.role;

      if (liveRole === 'admin') {
        req.user.role = 'admin';
        return next();
      }
    }

    // 4. Default: Forbidden
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied: Platform administrator privileges required.'
      }
    });
  } catch (err) {
    console.error('RBAC requireAdmin error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Failed to verify administrative authorization.'
      }
    });
  }
};
