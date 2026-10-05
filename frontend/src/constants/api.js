// Configuración de la API
let baseURL = '/api'; // Por defecto, URL relativa (funciona en producción con proxy)

if (import.meta.env.VITE_API_URL) {
  // Si hay una variable de entorno configurada, úsala
  baseURL = import.meta.env.VITE_API_URL;
} else if (import.meta.env.DEV) {
  // Solo en desarrollo local
  baseURL = 'http://localhost:5000/api';
}

export const API_BASE_URL = baseURL;
export const API_TIMEOUT = 8000; // 8 seconds (API en Vercel, respuesta rápida)

