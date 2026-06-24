import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Injecte le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion globale des erreurs
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
