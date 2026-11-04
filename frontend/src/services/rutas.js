import api from './api';

/**
 * Obtiene todas las rutas disponibles
 */
export async function getRutas() {
  try {
    const response = await api.get('/rutas');
    return response.data;
  } catch (err) {
    console.error('Error fetching rutas:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener rutas');
  }
}

export async function getCiudadesRutas() {
  try {
    const response = await api.get('/rutas/ciudades');
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener ciudades');
  }
}

/**
 * Obtiene una ruta por ID (hace fetch fresco al backend)
 */
export async function getRutaById(id) {
  try {
    const response = await api.get(`/rutas/${id}`);
    return response.data;
  } catch (err) {
    console.error(`Error fetching ruta ${id}:`, err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener la ruta');
  }
}

/**
 * Crea una ruta (Admin). El backend deriva el nombre de from-to si no se envía.
 */
export async function createRuta(data) {
  try {
    const response = await api.post('/rutas', data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al crear la ruta');
  }
}

export async function updateRuta(id, data) {
  try {
    const response = await api.put(`/rutas/${id}`, data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al actualizar la ruta');
  }
}

/**
 * Elimina una ruta por ID (Admin).
 */
export async function deleteRuta(id) {
  try {
    const response = await api.delete(`/rutas/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al eliminar la ruta');
  }
}
