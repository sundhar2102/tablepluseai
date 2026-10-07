import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    window.Capacitor?.isNativePlatform?.() ||
    !!window.androidBridge ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173')
  );
};

export const getApiBaseUrl = () => {
  if (isNativeApp()) {
    if (import.meta.env.VITE_MOBILE_API_URL) {
      return import.meta.env.VITE_MOBILE_API_URL;
    }
    if (import.meta.env.VITE_API_HOST) {
      const host = import.meta.env.VITE_API_HOST.trim();
      const port = host.includes(':') ? '' : ':3001';
      return `http://${host}${port}/api`;
    }
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
      return envUrl;
    }
    return 'http://10.0.2.2:3001/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API] Initialized Base URL:', API_BASE_URL, '| Native detected:', isNativeApp());

/**
 * Centralised Axios instance.
 * All API calls must use this instance to ensure:
 *  - Consistent base URL
 *  - Automatic JWT injection
 *  - Standardised error handling
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: inject JWT token & testing simulator ─────
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (typeof window !== 'undefined' && window.__simulateRestaurantError && config.url?.includes('/restaurants')) {
      const err = new Error('Restaurant discovery is temporarily unavailable. Failed to fetch restaurants');
      err.response = {
        status: 503,
        data: {
          success: false,
          error: {
            code: 'DISCOVERY_UNAVAILABLE',
            message: 'Restaurant discovery is temporarily unavailable. Failed to fetch restaurants',
          },
        },
      };
      return Promise.reject(err);
    }
    const token = localStorage.getItem('smarttable_token') || localStorage.getItem('tp_token');
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
