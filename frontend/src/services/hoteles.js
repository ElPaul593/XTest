import api from './api';

export async function getHoteles(ciudad = null) {
  try {
    const url = ciudad ? `/hoteles?ciudad=${ciudad}` : '/hoteles';
    const resp = await api.get(url);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener hoteles';
    throw new Error(message);
  }
}

export async function getHotelById(id) {
  try {
    const resp = await api.get(`/hoteles/${id}`);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener hotel';
    throw new Error(message);
  }
}

