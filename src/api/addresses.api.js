import api from './axios';

export const addressesApi = {
  getAll: () => api.get('/api/addresses'),
  create: (data) => api.post('/api/addresses', data),
  update: (id, data) => api.put(`/api/addresses/${id}`, data),
  delete: (id) => api.delete(`/api/addresses/${id}`),
};
