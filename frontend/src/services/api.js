import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT
});

// Interceptor de REQUEST: añadir el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE: limpiar token inválido globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Si el token es inválido o expiró, cerrar sesión automáticamente
    if (status === 401 || status === 403) {
      const isTokenError =
        data?.error?.toLowerCase().includes('token') ||
        data?.message?.toLowerCase().includes('token') ||
        data?.error?.toLowerCase().includes('invalid') ||
        data?.error?.toLowerCase().includes('inválido') ||
        status === 401;

      if (isTokenError) {
        console.warn('[API] Token inválido/expirado - cerrando sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');

        if (
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')
        ) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

