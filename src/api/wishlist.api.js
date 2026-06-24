import api from './axios';

export const wishlistApi = {
  getAll: () => api.get('/api/wishlist'),
  add: (productId) => api.post('/api/wishlist', { productId }),
  remove: (productId) => api.delete(`/api/wishlist/${productId}`),
};
