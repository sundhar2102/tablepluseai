import api from './api';

/**
 * Reservation service — customer and owner table bookings
 */
export const reservationService = {
  /**
   * Customer: Create a new table reservation
   */
  async createReservation(payload) {
    try {
      const res = await api.post('/reservations', payload);
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to create reservation' },
      };
    }
  },

  /**
   * Customer: Get list of reservations
   */
  async getCustomerReservations() {
    try {
      const res = await api.get('/reservations');
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch reservations' },
      };
    }
  },

  /**
   * Customer / Owner: Get reservation details by id
   */
  async getReservationById(id) {
    try {
      const res = await api.get(`/reservations/${id}`);
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch reservation details' },
      };
    }
  },

  /**
   * Customer / Owner: Cancel a reservation
   */
  async cancelReservation(id, cancellationReason = '') {
    try {
      const res = await api.patch(`/reservations/${id}/cancel`, { cancellationReason });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to cancel reservation' },
      };
    }
  },

  /**
   * Owner: Get reservations for owner's restaurant
   */
  async getOwnerReservations(params = {}) {
    try {
      const res = await api.get('/owner/reservations', { params });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to fetch owner reservations' },
      };
    }
  },

  /**
   * Owner: Update reservation status
   */
  async updateOwnerReservationStatus(id, { status, rejectionReason }) {
    try {
      const res = await api.patch(`/owner/reservations/${id}/status`, { status, rejectionReason });
      return { data: res.data.data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err.response?.data?.error || { message: 'Failed to update reservation status' },
      };
    }
  },
};
