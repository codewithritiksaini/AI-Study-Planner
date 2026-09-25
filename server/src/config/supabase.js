import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseAdminInstance = null;

/**
 * Initializes and returns the server-side Supabase Admin client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for trusted server operations.
 * Returns null if Supabase credentials are not configured in current phase.
 */
export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  if (
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_URL.includes('placeholder')
  ) {
    return null;
  }

  try {
    supabaseAdminInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return supabaseAdminInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
    return null;
  }
};
