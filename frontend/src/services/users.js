import api from './api';

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

export async function deleteCurrentUser() {
  try {
    // Primero obtenemos el usuario actual para obtener su ID
    const currentUser = await getCurrentUser();
    // Luego eliminamos usando el ID
    const response = await api.delete(`/users/${currentUser._id}`, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Error al eliminar cuenta';
    throw new Error(message);
  }
}