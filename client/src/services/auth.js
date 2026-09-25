import { supabase } from './supabase.js';
import api from './api.js';

const isSupabaseConfigured = () => {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    supabase?.auth?.signInWithPassword &&
    anonKey &&
    !anonKey.includes('placeholder')
  );
};

const notifyAuthChange = (event, session) => {
  window.dispatchEvent(new CustomEvent('auth-state-change', { detail: { event, session } }));
};

/**
 * Authentication Service
 * Wraps Supabase Auth client methods with standardized error handling
 * and falls back seamlessly to direct backend database authentication when needed.
 */
export const authService = {
  /**
   * Register a new student account using email and password.
   */
  async signUp({ email, password, fullName, branch, semester, targetCgpa }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || ''
          }
        }
      });

      if (error) {
        throw {
          code: error.code || 'SIGNUP_FAILED',
          message: error.message || 'Failed to create student account.'
        };
      }

      return data;
    }

    // Direct database backend registration
    const res = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      branch,
      semester,
      target_cgpa: targetCgpa
    });

    if (res?.session) {
      localStorage.setItem('auth_session', JSON.stringify(res.session));
      notifyAuthChange('SIGNED_IN', res.session);
    }

    return res;
  },

  /**
   * Sign in an existing student account using email and password.
   */
  async signIn({ email, password }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw {
          code: error.code || 'AUTH_INVALID_CREDENTIALS',
          message: error.message || 'Invalid email or password.'
        };
      }

      return data;
    }

    // Direct database backend login
    const res = await api.post('/auth/login', { email, password });
    if (res?.session) {
      localStorage.setItem('auth_session', JSON.stringify(res.session));
      notifyAuthChange('SIGNED_IN', res.session);
    }

    return res;
  },

  /**
   * Sign out the active student user.
   */
  async signOut() {
    localStorage.removeItem('auth_session');
    notifyAuthChange('SIGNED_OUT', null);

    if (supabase?.auth?.signOut) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Signout warning:', error.message);
      }
    }
  },

  /**
   * Get current active session.
   */
  async getSession() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          return data.session;
        }
      } catch (error) {
        console.warn('Get session error:', error.message);
      }
    }

    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('auth_session');
      }
    }
    return null;
  },

  /**
   * Get current authenticated user.
   */
  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  },

  /**
   * Listen to auth state changes (both Supabase and custom session events).
   */
  onAuthStateChange(callback) {
    const customListener = (event) => {
      callback(event.detail?.event, event.detail?.session);
    };
    window.addEventListener('auth-state-change', customListener);

    let supabaseSub = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(callback);
      supabaseSub = data?.subscription;
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('auth-state-change', customListener);
            supabaseSub?.unsubscribe?.();
          }
        }
      }
    };
  }
};

export default authService;
