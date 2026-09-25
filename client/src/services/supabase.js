import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('⚠️ Supabase client initialization deferred:', err.message);
  }
} else {
  // In Phase 1, placeholder is expected until auth setup in Phase 2
  // A mock stub prevents runtime import errors
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

export const supabase = supabaseInstance;
export default supabase;
