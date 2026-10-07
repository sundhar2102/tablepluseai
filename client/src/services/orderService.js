import api from './api';

export const orderService = {
  // Customer: Create order
  createOrder: async (orderData) => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },

  // Customer: Get my orders
  getMyOrders: async () => {
    const res = await api.get('/orders/my');
    return res.data;
  },

  // Customer/Owner: Get order by ID
  getOrderById: async (orderId) => {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },

  // Customer: Cancel order
  cancelOrder: async (orderId) => {
    const res = await api.patch(`/orders/${orderId}/cancel`);
    return res.data;
  },

  // Owner: Get orders with filters
  getOwnerOrders: async (params = {}) => {
    const res = await api.get('/owner/orders', { params });
    return res.data;
  },

  // Owner: Update order status
  updateOrderStatus: async (orderId, status) => {
    const res = await api.patch(`/owner/orders/${orderId}/status`, { status });
    return res.data;
  },
};

export default orderService;
