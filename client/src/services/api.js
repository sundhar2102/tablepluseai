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

export const NETWORK_ERROR_FRIENDLY_MESSAGE =
  'Unable to connect to Smart Table AI server. Please check that the server is running and your phone is connected to the same Wi-Fi.';

export const getApiBaseUrl = () => {
  // 1. Runtime override support (allows setting without rebuilding APK if LAN IP changes)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('smarttable_api_url') || localStorage.getItem('tp_api_url');
    if (customUrl) return customUrl.trim();
    const customHost = localStorage.getItem('smarttable_api_host') || localStorage.getItem('tp_api_host');
    if (customHost) {
      const host = customHost.trim();
      const port = host.includes(':') ? '' : ':3001';
      return `http://${host}${port}/api`;
    }
  }

  // 2. Native mobile app environment (Capacitor on Android/iOS)
  if (isNativeApp()) {
    let resolvedUrl = '';

    if (import.meta.env.VITE_MOBILE_API_URL) {
      resolvedUrl = import.meta.env.VITE_MOBILE_API_URL.trim();
    } else if (import.meta.env.VITE_API_HOST) {
      const host = import.meta.env.VITE_API_HOST.trim();
      const port = host.includes(':') ? '' : ':3001';
      resolvedUrl = `http://${host}${port}/api`;
    } else {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
        resolvedUrl = envUrl.trim();
      } else {
        // Fallback for native development: active LAN IP
        resolvedUrl = 'http://10.0.2.2:3001/api';
      }
    }

    // Guard: Physical Android devices cannot use localhost or 127.0.0.1
    if (resolvedUrl.includes('localhost') || resolvedUrl.includes('127.0.0.1')) {
      const lanHost = (import.meta.env.VITE_API_HOST && !import.meta.env.VITE_API_HOST.includes('localhost'))
        ? import.meta.env.VITE_API_HOST.trim()
        : '10.0.2.2';
      resolvedUrl = resolvedUrl.replace(/localhost|127\.0\.0\.1/g, lanHost);
    }

    return resolvedUrl;
  }

  // 3. Web environment (Vite proxy handles '/api' -> http://localhost:3001)
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

// ── Response interceptor: handle auth & network errors globally ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.error?.code;

    if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID')) {
      // Clear stored auth and redirect to login
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      localStorage.removeItem('smarttable_token');
      localStorage.removeItem('smarttable_user');
      window.location.href = '/login';
    }

    // User-friendly network error enhancement
    if (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      error.isNetworkError = true;
      error.originalMessage = error.message;
      if (!error.response) {
        error.message = NETWORK_ERROR_FRIENDLY_MESSAGE;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
