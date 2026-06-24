import api from './axios';

export const reviewsApi = {
  getByProduct: (productId) => api.get(`/api/reviews/${productId}`),
  create: (data) => api.post('/api/reviews', data),
  delete: (id) => api.delete(`/api/reviews/${id}`),
};
