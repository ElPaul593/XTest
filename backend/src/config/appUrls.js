// Mismo motivo que en `externalApis.js`: este módulo lee `process.env` al
// importarse y puede alcanzarse antes de que `app.js` cargue el `.env`.
require('dotenv').config();

/**
 * URLs públicas de la aplicación.
 *
 * Se resuelven desde variables de entorno porque el backend y el frontend se
 * despliegan por separado (Render / Vercel) y los enlaces que viajan por correo
 * tienen que apuntar al host real, no a localhost.
 */

// Host público del backend. Es el que se incrusta en el enlace de recuperación
// de contraseña que recibe el usuario por correo.
const VERCEL_BACKEND_URL = (
  process.env.VERCEL_BACKEND_URL ||
  process.env.BACKEND_PUBLIC_URL ||
  process.env.PUBLIC_API_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');

// Host público del frontend (SPA). Se usa para devolver al usuario a la
// aplicación una vez completado el reseteo.
const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  process.env.VERCEL_FRONTEND_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

/**
 * Construye el enlace de restablecimiento que se envía por correo.
 * Apunta al backend: es él quien valida el token antes de mostrar el formulario,
 * así un token caducado nunca llega a renderizar la pantalla de cambio.
 */
function buildResetPasswordUrl(token) {
  return `${VERCEL_BACKEND_URL}/api/auth/reset-password/${token}`;
}

/**
 * Enlace de verificación del correo. Apunta al backend por el mismo motivo que el
 * de reseteo: así el token se comprueba en el servidor y el usuario ve una página
 * con el resultado aunque el frontend esté caído.
 */
function buildVerifyEmailUrl(token) {
  return `${VERCEL_BACKEND_URL}/api/auth/verify-email/${token}`;
}

module.exports = {
  VERCEL_BACKEND_URL,
  FRONTEND_URL,
  buildResetPasswordUrl,
  buildVerifyEmailUrl
};
