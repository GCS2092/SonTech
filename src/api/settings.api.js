// settings.api.js
import api from './axios';

export const settingsApi = {
  getPublic: () => api.get('/api/settings'),
};