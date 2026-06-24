import api from './axios';

export const cartApi = {
  getCart: (params) => api.get('/api/cart', { params }),
  addItem: (data) => api.post('/api/cart/items', data),
  updateItem: (itemId, data) => api.put(`/api/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/api/cart/items/${itemId}`),
  clearCart: (params) => api.delete('/api/cart', { params }),
};
