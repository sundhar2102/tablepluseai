import api from './api';

export const tableService = {
  // Resolve table from QR token
  getTableByQrToken: async (qrToken) => {
    const res = await api.get(`/tables/qr/${qrToken}`);
    return res.data;
  },

  // Get restaurant tables
  getRestaurantTables: async (restaurantId) => {
    const res = await api.get(`/restaurants/${restaurantId}/tables`);
    return res.data;
  },

  // Get table by ID
  getTableById: async (tableId) => {
    const res = await api.get(`/tables/${tableId}`);
    return res.data;
  },
};

export default tableService;
