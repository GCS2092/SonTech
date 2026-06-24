import api from './axios';

export const productsApi = {
  getAll: (params) => api.get('/api/products', { params }),
  getBySlug: (slug) => api.get(`/api/products/${slug}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
};
