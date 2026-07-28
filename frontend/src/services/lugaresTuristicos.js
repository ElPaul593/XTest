import api from './api';

export async function getLugaresTuristicos(ciudad = null) {
  try {
    const url = ciudad ? `/lugares-turisticos?ciudad=${encodeURIComponent(ciudad.trim())}` : '/lugares-turisticos';
    console.log('Llamando a API:', url);
    const resp = await api.get(url);
    console.log('Respuesta de API lugares turísticos:', resp.data);
    return resp.data || [];
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener lugares turísticos';
    console.error('Error obteniendo lugares turísticos:', message, err.response?.data);
    // Retornar array vacío en lugar de lanzar error para mejor UX
    return [];
  }
}

export async function getLugarTuristicoById(id) {
  try {
    const resp = await api.get(`/lugares-turisticos/${id}`);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener lugar turístico';
    throw new Error(message);
  }
}

