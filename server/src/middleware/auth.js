import { getSupabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { verifySessionToken } from '../utils/token.js';

/**
 * Authentication Middleware
 * Validates the session token or Supabase JWT Bearer token passed in the Authorization header.
 * Derives user identity strictly from the verified token.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is missing. Please provide a valid Bearer token.'
        }
      });
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Malformed authorization header. Format should be: Bearer <token>'
        }
      });
    }

    let authenticatedUser = null;

    // Approach 0: Check signed session token (direct database auth)
    const verifiedSession = verifySessionToken(token);
    if (verifiedSession) {
      authenticatedUser = {
        id: verifiedSession.id || verifiedSession.sub,
        email: verifiedSession.email,
        role: verifiedSession.app_role || verifiedSession.user_metadata?.role || 'student',
        user_metadata: verifiedSession.user_metadata || {}
      };
    }

    // Approach 1: Check using getSupabaseAdmin client if configured with service role key
    if (!authenticatedUser) {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) {
          authenticatedUser = data.user;
        }
      }
    }

    // Approach 2: If admin client is not available or failed, verify via Supabase Auth REST API
    if (!authenticatedUser && env.SUPABASE_URL) {
      try {
        const apiKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
          ? env.SUPABASE_SERVICE_ROLE_KEY
          : (env.SUPABASE_ANON_KEY || 'placeholder');

        const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': apiKey
          }
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            authenticatedUser = userData;
          }
        }
      } catch (fetchErr) {
        // Safe internal error logging without leaking tokens
        console.error('Supabase Auth verification request failed:', fetchErr.message);
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session has expired or token is invalid. Please log in again.'
        }
      });
    }

    // Strictly attach verified user identity to request.
    // Client-provided user_id in params or body is never trusted.
    req.user = {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      user_metadata: authenticatedUser.user_metadata || {}
    };

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An unexpected error occurred during authentication.'
      }
    });
  }
};
