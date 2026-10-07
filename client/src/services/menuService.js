import api from './api';

export const menuService = {
  // Get restaurant menu (categories + items)
  getMenu: async (restaurantId) => {
    const res = await api.get(`/restaurants/${restaurantId}/menu`);
    return res.data;
  },

  // Get specific item
  getItem: async (itemId) => {
    const res = await api.get(`/menu/items/${itemId}`);
    return res.data;
  },

  // Owner: Add category
  createCategory: async (data) => {
    const res = await api.post('/owner/menu/categories', data);
    return res.data;
  },

  // Owner: Update category
  updateCategory: async (id, data) => {
    const res = await api.patch(`/owner/menu/categories/${id}`, data);
    return res.data;
  },

  // Owner: Delete category
  deleteCategory: async (id) => {
    const res = await api.delete(`/owner/menu/categories/${id}`);
    return res.data;
  },

  // Owner: Add item
  createItem: async (data) => {
    const res = await api.post('/owner/menu/items', data);
    return res.data;
  },

  // Owner: Update item
  updateItem: async (id, data) => {
    const res = await api.patch(`/owner/menu/items/${id}`, data);
    return res.data;
  },

  // Owner: Toggle item availability
  toggleAvailability: async (id) => {
    const res = await api.patch(`/owner/menu/items/${id}/toggle`);
    return res.data;
  },

  // Owner: Delete item
  deleteItem: async (id) => {
    const res = await api.delete(`/owner/menu/items/${id}`);
    return res.data;
  },
};

export default menuService;
