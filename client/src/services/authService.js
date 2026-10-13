import api, { NETWORK_ERROR_FRIENDLY_MESSAGE } from './api';

/**
 * Auth service — all API calls related to authentication.
 * Returns { data, error } — never throws to the calling component.
 */

export const authService = {

  async register(payload) {
    try {
      const res = await api.post('/auth/register', payload);
      return { data: res.data, error: null };
    } catch (err) {
      console.error('[authService] register error:', err);
      const errMsg = err.response?.data?.error?.message 
        || (err.response ? 'Registration failed' : NETWORK_ERROR_FRIENDLY_MESSAGE);
      return { data: null, error: err.response?.data?.error || { message: errMsg } };
    }
  },

  async login(payload) {
    try {
      const res = await api.post('/auth/login', payload);
      const { token, user } = res.data.data;
      // Store auth in localStorage
      localStorage.setItem('smarttable_token', token);
      localStorage.setItem('smarttable_user',  JSON.stringify(user));
      localStorage.setItem('tp_token', token);
      localStorage.setItem('tp_user',  JSON.stringify(user));
      return { data: { token, user }, error: null };
    } catch (err) {
      console.error('[authService] login error:', err);
      const errMsg = err.response?.data?.error?.message 
        || (err.response ? 'Login failed' : NETWORK_ERROR_FRIENDLY_MESSAGE);
      return { data: null, error: err.response?.data?.error || { message: errMsg } };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('smarttable_token');
      localStorage.removeItem('smarttable_user');
      localStorage.removeItem('smarttable_cart');
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      localStorage.removeItem('tp_cart');
    }
  },

  async getMe() {
    try {
      const res = await api.get('/users/me');
      return { data: res.data.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.error || { message: 'Failed to fetch profile' } };
    }
  },

  async updateMe(payload) {
    try {
      const res = await api.patch('/users/me', payload);
      return { data: res.data.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.error || { message: 'Update failed' } };
    }
  },

  async changePassword(payload) {
    try {
      const res = await api.patch('/users/me/password', payload);
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.error || { message: 'Password change failed' } };
    }
  },

  // Utility: get stored user from localStorage (synchronous)
  getStoredUser() {
    try {
      const raw = localStorage.getItem('smarttable_user') || localStorage.getItem('tp_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Utility: check if token exists
  isAuthenticated() {
    return !!(localStorage.getItem('smarttable_token') || localStorage.getItem('tp_token'));
  },
};
