import axios from 'axios';

import { supabase } from './supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Injects Auth Bearer token when available
api.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // 1. Try Supabase session if configured
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabase?.auth?.getSession && anonKey && !anonKey.includes('placeholder')) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token;
      }

      // 2. Try stored session in localStorage (direct database auth)
      if (!token && typeof window !== 'undefined') {
        const stored = localStorage.getItem('auth_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            token = parsed?.access_token;
          } catch {}
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Safe fallback if token retrieval encounters an issue
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardizes JSON responses & error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to the backend server'
    };
    return Promise.reject(errorResponse);
  }
);

export default api;
