import api from './api';

function getErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;
}

export async function getAllLugaresTuristicos(ciudad = null) {
  try {
    const url = ciudad ? `/lugares-turisticos?ciudad=${encodeURIComponent(ciudad.trim())}` : '/lugares-turisticos';
    const response = await api.get(url);
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Error al obtener lugares turísticos'));
  }
}

export async function getLugarTuristicoById(id) {
  try {
    const response = await api.get(`/lugares-turisticos/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Error al obtener lugar turístico'));
  }
}

export async function createLugarTuristico(data) {
  try {
    const response = await api.post('/lugares-turisticos', data);
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Error al crear lugar turístico'));
  }
}

export async function updateLugarTuristico(id, data) {
  try {
    const response = await api.put(`/lugares-turisticos/${id}`, data);
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Error al actualizar lugar turístico'));
  }
}

export async function deleteLugarTuristico(id) {
  try {
    const response = await api.delete(`/lugares-turisticos/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, 'Error al eliminar lugar turístico'));
  }
}