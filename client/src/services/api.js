import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Centralised Axios instance.
 * All API calls must use this instance to ensure:
 *  - Consistent base URL
 *  - Automatic JWT injection
 *  - Standardised error handling
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: inject JWT token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tp_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors globally ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.error?.code;

    if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID')) {
      // Clear stored auth and redirect to login
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
