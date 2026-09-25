import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Injects Auth Bearer token when available
api.interceptors.request.use(
  (config) => {
    // In Phase 2+, the active Supabase access token will be injected here
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
