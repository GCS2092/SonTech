import api from './axios';

export const usersApi = {
  getMe: () => api.get('/api/users'),
  update: (data) => api.put('/api/users', data),
};
