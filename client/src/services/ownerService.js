// client/src/services/ownerService.js
import api from './api';

export const ownerService = {
  // Restaurant Profile & Operating controls
  async getRestaurant() {
    const res = await api.get('/owner/restaurant');
    return res.data.data;
  },

  async updateRestaurant(data) {
    const res = await api.patch('/owner/restaurant', data);
    return res.data.data;
  },

  // Central Control Panel & Dashboard Overview
  async getDashboardStats() {
    const res = await api.get('/owner/dashboard');
    return res.data.data;
  },

  // Live Table Management
  async getTables() {
    const res = await api.get('/owner/tables');
    return res.data.data;
  },

  async updateTableStatus(tableId, status) {
    const res = await api.patch(`/owner/tables/${tableId}/status`, { status });
    return res.data.data;
  },

  // Order Management & Kitchen Synchronization
  async getOrders(params = {}) {
    const res = await api.get('/owner/orders', { params });
    return res.data;
  },

  async updateOrderStatus(orderId, status) {
    const res = await api.patch(`/owner/orders/${orderId}/status`, { status });
    return res.data.data;
  },

  // Reservation Management
  async getReservations(params = {}) {
    const res = await api.get('/owner/reservations', { params });
    return res.data.data;
  },

  async updateReservationStatus(reservationId, data) {
    const res = await api.patch(`/owner/reservations/${reservationId}/status`, data);
    return res.data.data;
  },

  // Customers Management
  async getCustomers() {
    const res = await api.get('/owner/customers');
    return res.data.data;
  },

  // Analytics & Business Performance
  async getAnalytics(timeframe = '7d') {
    const res = await api.get('/owner/analytics', { params: { timeframe } });
    return res.data.data;
  },

  // Notifications
  async getNotifications() {
    const res = await api.get('/owner/notifications');
    return res.data.data;
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/owner/notifications/${id}/read`);
    return res.data;
  },
};

export default ownerService;
