import { supabase } from './supabase.js';

/**
 * Authentication Service
 * Wraps Supabase Auth client methods with standardized error handling.
 */
export const authService = {
  /**
   * Register a new student account using email and password.
   * Handles user metadata (e.g. full_name) for automatic profile generation.
   */
  async signUp({ email, password, fullName }) {
    if (!supabase?.auth?.signUp) {
      throw {
        code: 'AUTH_UNAVAILABLE',
        message: 'Supabase authentication service is currently not configured.'
      };
    }

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
  },

  /**
   * Sign in an existing student account using email and password.
   */
  async signIn({ email, password }) {
    if (!supabase?.auth?.signInWithPassword) {
      throw {
        code: 'AUTH_UNAVAILABLE',
        message: 'Supabase authentication service is currently not configured.'
      };
    }

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
  },

  /**
   * Sign out the active student user.
   */
  async signOut() {
    if (!supabase?.auth?.signOut) {
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Signout warning:', error.message);
    }
  },

  /**
   * Get current active session.
   */
  async getSession() {
    if (!supabase?.auth?.getSession) {
      return null;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Get session error:', error.message);
      return null;
    }
    return data?.session || null;
  },

  /**
   * Get current authenticated user.
   */
  async getUser() {
    if (!supabase?.auth?.getUser) {
      return null;
    }
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data?.user || null;
  },

  /**
   * Listen to Supabase auth state changes.
   */
  onAuthStateChange(callback) {
    if (!supabase?.auth?.onAuthStateChange) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default authService;
