import api from './axios';

export const notificationsApi = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  delete: (id) => api.delete(`/api/notifications/${id}`),
};
