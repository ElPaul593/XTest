import api from './api';

/**
 * #22BUG — Código redundante que no hace nada: `getAuthToken` / `getAuthHeaders`.
 *
 * `services/api.js` ya instala un interceptor de petición que añade
 * `Authorization: Bearer <token>` a TODAS las llamadas que salen por esa
 * instancia de axios. Cada `{ headers: getAuthHeaders() }` de este archivo vuelve
 * a calcular y adjuntar la misma cabecera que el interceptor pondría de todos
 * modos; axios la sobrescribe con un valor idéntico.
 *
 * Es decir: 9 llamadas pasan un objeto de cabeceras cuyo efecto neto es nulo.
 * No rompe nada, pero hace creer que estas funciones necesitan autenticación
 * manual y que otras (las que no lo pasan) van sin token, cuando todas la llevan.
 * Este es el único archivo de `services/` que lo hace; el resto confía en el
 * interceptor.
 *
 * Verificado: `api.js` líneas 10-21 (interceptors.request.use).
 */
// Función para obtener el token del localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Función para configurar headers con token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function listUsers(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.page) qs.append('page', params.page);
    if (params.limit) qs.append('limit', params.limit);
    if (params.search) qs.append('search', params.search);
    // Filtro por estado de cuenta: ACTIVO | BLOQUEADO | ELIMINADO.
    // Sin él se listan todas, incluidas las bloqueadas y las dadas de baja.
    if (params.estado) qs.append('estado', params.estado);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const response = await api.get(`/users${suffix}`, {
      headers: getAuthHeaders()
    });
    // Sin paginación devuelve un array; con paginación devuelve { data, pagination }.
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.error || err.message || 'Error al obtener usuarios';
    throw new Error(message);
  }
}

export async function createUser(userData) {
  try {
    const response = await api.post('/users', userData, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.error || err.message || 'Error al crear usuario';
    throw new Error(message);
  }
}

export async function updateUser(id, userData) {
  try {
    const response = await api.put(`/users/${id}`, userData, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.error || err.message || 'Error al actualizar usuario';
    throw new Error(message);
  }
}

/**
 * Baja administrativa de una cuenta ajena (`DELETE /api/users/:id`).
 *
 * Desde el rediseño del manejo de cuentas, el panel admin ya no ofrece
 * "Eliminar": usa `cambiarEstadoUsuario` con BLOQUEADO / ELIMINADO / ACTIVO,
 * porque así queda constancia del motivo y la acción es reversible. Por eso esta
 * función no se invoca hoy desde ninguna pantalla.
 *
 * Se conserva a propósito, no por descuido: el endpoint sigue existiendo (ahora
 * hace baja LÓGICA, ya no borrado físico) y se usa desde la colección de Postman
 * de `backend/docs/postman_collection.json`. Si se decide retirar también el
 * endpoint, esta función debe irse con él.
 */
export async function deleteUser(id) {
  try {
    const response = await api.delete(`/users/${id}`, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Error al eliminar usuario';
    throw new Error(message);
  }
}

/**
 * #23BUG — Función muerta: `getUserById` no se importa en ninguna pantalla.
 * El panel administrativo (`pages/admin/AdminUsers.jsx`) trabaja siempre con la
 * lista completa que devuelve `listUsers` y edita en la propia fila de la tabla,
 * así que nunca necesita cargar un usuario suelto.
 * Verificado: 0 importaciones de `getUserById` en `pages/` y `components/`.
 */
export async function getUserById(id) {
  try {
    const response = await api.get(`/users/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Error al obtener usuario';
    throw new Error(message);
  }
}

/**
 * Cambia el estado de una cuenta: bloquear, reactivar o dar de baja (solo admin).
 * Sustituye al borrado de usuarios como herramienta de moderación: ninguna de las
 * tres operaciones elimina datos de la base.
 *
 * @param {string} id
 * @param {'ACTIVO'|'BLOQUEADO'|'ELIMINADO'} estado
 * @param {string} [motivo] Texto que verá el usuario al intentar iniciar sesión.
 */
export async function cambiarEstadoUsuario(id, estado, motivo) {
  try {
    const response = await api.patch(`/users/${id}/estado`, { estado, motivo });
    return response.data;
  } catch (err) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err.message ||
      'Error al cambiar el estado de la cuenta';
    throw new Error(message);
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get('/users/me', { headers: getAuthHeaders() });
    return response.data;
  } catch (err) {
    // Si el token es inválido o expiró, limpiar localStorage y redirigir al login
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      console.warn('Token inválido o expirado. Cerrando sesión automáticamente.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Solo redirigir si no estamos ya en Login/Register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      return null;
    }
    const message = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Error al obtener usuario actual';
    throw new Error(message);
  }
}

export async function updateCurrentUser(userData) {
  try {
    // Usar la ruta /users/me para actualizar el perfil del usuario actual
    const response = await api.put('/users/me', userData, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.error || err.message || 'Error al actualizar perfil';
    throw new Error(message);
  }
}

/**
 * Baja de la cuenta propia.
 *
 * Llama a `DELETE /api/users/me`, que identifica al usuario por su token.
 * La baja es LÓGICA: la cuenta pasa a estado `ELIMINADO` y deja de poder iniciar
 * sesión, pero el documento se conserva para no dejar huérfanas las reservas,
 * boletos y calificaciones asociadas.
 *
 * Ver #17BUG en `backend/src/controllers/userController.js`: la versión anterior
 * pedía `/users/me` solo para extraer el `_id` y llamaba a `DELETE /users/:id`,
 * una ruta restringida a administradores, por lo que devolvía 403 a cualquier
 * usuario con rol USER.
 */
export async function deleteCurrentUser() {
  try {
    const response = await api.delete('/users/me');
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Error al dar de baja la cuenta';
    throw new Error(message);
  }
}