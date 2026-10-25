/**
 * ============================================================================
 * #20BUG — ARCHIVO HUÉRFANO: la vista que debía consumirlo usa otro servicio.
 * ============================================================================
 *
 * Ninguna pantalla importa este módulo. Por el nombre debería alimentar
 * `pages/admin/AdminLugares.jsx`, pero esa vista importa de
 * `services/lugaresTuristicos.js`, de modo que estas funciones quedaron sin uso.
 *
 * Verificado: 0 importaciones de `lugaresTuristicosAdmin` en `pages/` y
 * `components/`.
 *
 * El riesgo real es la duplicación: hay dos servicios que atacan los mismos
 * endpoints de `/lugares-turisticos` con distinto manejo de errores, y no hay
 * forma de saber cuál es el bueno sin rastrear las importaciones.
 * ============================================================================
 */

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