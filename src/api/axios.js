import axios from 'axios';
import { AUTH_TOKEN_KEY, STORE_ID } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Injecte storeId automatiquement sur toutes les requêtes GET
  if (config.method === 'get' || !config.method) {
    config.params = { ...config.params, storeId: STORE_ID };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Une erreur est survenue';

    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
    }

    return Promise.reject({ status, message, raw: error });
  }
);

export default api;