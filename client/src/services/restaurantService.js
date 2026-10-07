import api from './api';

/**
 * Restaurant service — all API calls for restaurant discovery and live table availability.
 */
export const restaurantService = {
  /**
   * Get list of restaurants with optional location coordinates and filters.
   * params: { lat, lng, radius, search, area, cuisine, openNow }
   */
  async getRestaurants(params = {}) {
    try {
      const res = await api.get('/restaurants', { params });
      return { data: res.data.data, error: null };
    } catch (err) {
      const serverErr = err.response?.data?.error;
      const msg = serverErr?.message || err.response?.data?.message || 'Failed to fetch restaurants';
      return {
        data: null,
        error: {
          code: serverErr?.code || (err.code === 'ECONNABORTED' ? 'TIMEOUT' : 'FETCH_ERROR'),
          message: msg,
        },
      };
    }
  },

  /**
   * Get restaurant details by id or slug with live table availability.
   * params: { lat, lng } (optional for distance calculation)
   */
  async getRestaurantById(idOrSlug, params = {}) {
    try {
      const res = await api.get(`/restaurants/${idOrSlug}`, { params });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch restaurant details' },
      };
    }
  },

  /**
   * Update table status (Stage 6 Part 1 testing / staff status toggle).
   */
  async updateTableStatus(restaurantId, tableId, status) {
    try {
      const res = await api.patch(`/restaurants/${restaurantId}/tables/${tableId}/status`, { status });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to update table status' },
      };
    }
  },
};
