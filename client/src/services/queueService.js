import api from './api';

/**
 * Queue service — virtual walk-in queue management
 */
export const queueService = {
  /**
   * Customer: Join walk-in queue
   */
  async joinQueue(payload) {
    try {
      const res = await api.post('/queue', payload);
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to join queue' },
      };
    }
  },

  /**
   * Customer: Get customer's queue entries
   */
  async getCustomerQueue() {
    try {
      const res = await api.get('/queue');
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch queue entries' },
      };
    }
  },

  /**
   * Customer / Owner: Get queue entry details
   */
  async getQueueById(id) {
    try {
      const res = await api.get(`/queue/${id}`);
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch queue details' },
      };
    }
  },

  /**
   * Customer / Owner: Cancel queue entry
   */
  async cancelQueue(id) {
    try {
      const res = await api.patch(`/queue/${id}/cancel`);
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to cancel queue entry' },
      };
    }
  },

  /**
   * Owner: Get queue list for owner's restaurant
   */
  async getOwnerQueue() {
    try {
      const res = await api.get('/owner/queue');
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch owner queue' },
      };
    }
  },

  /**
   * Owner: Update queue status (called, seated, cancelled)
   */
  async updateOwnerQueueStatus(id, { status }) {
    try {
      const res = await api.patch(`/owner/queue/${id}/status`, { status });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to update queue status' },
      };
    }
  },
};
