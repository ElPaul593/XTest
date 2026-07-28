import api from './api';

export async function getCalificaciones(tipo = null, referencia = null, usuario = null) {
  try {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (referencia) params.append('referencia', referencia);
    if (usuario) params.append('usuario', usuario);
    
    const url = `/calificaciones${params.toString() ? '?' + params.toString() : ''}`;
    const resp = await api.get(url);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener calificaciones';
    throw new Error(message);
  }
}

export async function createCalificacion(data) {
  try {
    const resp = await api.post('/calificaciones', data);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al crear calificación';
    throw new Error(message);
  }
}

export async function updateCalificacion(id, data) {
  try {
    const resp = await api.put(`/calificaciones/${id}`, data);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al actualizar calificación';
    throw new Error(message);
  }
}

export async function deleteCalificacion(id) {
  try {
    await api.delete(`/calificaciones/${id}`);
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al eliminar calificación';
    throw new Error(message);
  }
}

