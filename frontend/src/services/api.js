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

    /**
     * Cuenta bloqueada o dada de baja.
     *
     * El backend revisa el estado de la cuenta en CADA petición (no solo al
     * iniciar sesión), porque los JWT viven 8 horas: si un administrador bloquea
     * una cuenta, su token sigue siendo criptográficamente válido. En ese caso
     * responde 403 (BLOQUEADO) o 410 (ELIMINADO) con el campo `estado`.
     *
     * Se trata por separado del token inválido porque el mensaje no contiene la
     * palabra "token" y la comprobación de abajo no lo reconocería: el usuario se
     * quedaría con una sesión abierta que falla en todas las peticiones.
     */
    const estadoCuenta = data?.estado;
    if (estadoCuenta === 'BLOQUEADO' || estadoCuenta === 'ELIMINADO') {
      console.warn(`[API] Cuenta en estado ${estadoCuenta} - cerrando sesión`);

      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');

      // El motivo se guarda para que la pantalla de login pueda explicar por qué
      // se cerró la sesión en lugar de limitarse a expulsar al usuario.
      if (data?.error) {
        try {
          sessionStorage.setItem('authEstadoMensaje', data.error);
        } catch {
          // Modo privado o almacenamiento bloqueado: el cierre de sesión es lo
          // importante, el mensaje es un extra.
        }
      }

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

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

