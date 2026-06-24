import api from './axios';

export const ordersApi = {
  create: (data) => api.post('/api/orders', data),
  getMyOrders: () => api.get('/api/orders'),
  getByNumber: (orderNumber) => api.get(`/api/orders/${orderNumber}`),
  getAllAdmin: (params) => api.get('/api/orders/admin/all', { params }),
  changeStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
};
