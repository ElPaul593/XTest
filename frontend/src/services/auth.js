import api from './api';

export async function login({ cedula, pasaporte, password }) {
  try {
    const resp = await api.post('/auth/login', { cedula, pasaporte, password });
    return resp.data;
  } catch (err) {
    
    const message = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Error al conectar';
    throw new Error(message);
  }
}

export async function register(payload) {
  try {
    const resp = await api.post('/auth/register', payload);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Error al conectar';
    throw new Error(message);
  }
}

/**
 * Solicita el enlace de recuperación de contraseña.
 *
 * El backend genera el token y delega el ENVÍO del correo en la API consumidora
 * (`backend/src/services/mailerService.js`). El enlace que recibe el usuario
 * apunta al backend: `{VERCEL_BACKEND_URL}/api/auth/reset-password/{token}`, que
 * valida el token en el servidor antes de mostrar el formulario.
 *
 * Responde siempre con el mismo mensaje exista o no una cuenta con ese correo,
 * para que el endpoint no sirva como lista de usuarios registrados.
 */
export async function requestPasswordReset(email) {
  try {
    const resp = await api.post('/auth/forgot-password', { email });
    return resp.data;
  } catch (err) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err.message ||
      'No se pudo solicitar la recuperación de contraseña';
    throw new Error(message);
  }
}

/**
 * Estado del acceso con Google: si está habilitado y con qué client id.
 * Se pide al backend para no duplicar el client id en un `.env` del frontend
 * que podría desincronizarse.
 */
export async function getGoogleConfig() {
  try {
    const resp = await api.get('/auth/google/config');
    return resp.data;
  } catch {
    // Si el backend no responde, el botón simplemente no se muestra: el acceso
    // con cédula/pasaporte sigue disponible.
    return { habilitado: false, clientId: null };
  }
}

/**
 * Inicia sesión con el id_token de Google.
 *
 * Dos respuestas posibles, ambas con 200:
 *   · `{ token, role }`                   → sesión iniciada.
 *   · `{ requiereRegistro: true, perfil }` → no hay cuenta con ese correo. El
 *     modelo exige cédula o pasaporte y Google no los da, así que hay que
 *     completar el registro en lugar de crear una cuenta inválida.
 */
export async function loginConGoogle(credential) {
  try {
    const resp = await api.post('/auth/google', { credential });
    return resp.data;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      'No se pudo iniciar sesión con Google';
    throw new Error(message);
  }
}

/**
 * Reenvía el correo de verificación de la dirección.
 *
 * Como `requestPasswordReset`, responde siempre lo mismo exista o no la cuenta,
 * para que el endpoint no sirva para averiguar qué correos están registrados.
 */
export async function reenviarVerificacion(email) {
  try {
    const resp = await api.post('/auth/resend-verification', { email });
    return resp.data;
  } catch (err) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err.message ||
      'No se pudo reenviar el correo de verificación';
    throw new Error(message);
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}
