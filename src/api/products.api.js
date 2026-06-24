import api from './axios';
import { STORE_ID } from '../utils/constants';

export const productsApi = {
  getAll: (params) => api.get('/api/products', { params: { ...params, storeId: STORE_ID } }),
  getBySlug: (slug) => api.get(`/api/products/${slug}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
};