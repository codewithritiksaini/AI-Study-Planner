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
      if (supabase?.auth?.getSession) {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
