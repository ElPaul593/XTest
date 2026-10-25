import api from './api';

export async function getHoteles(ciudad = null) {
  try {
    const resp = await api.get('/hoteles', {
      params: ciudad ? { ciudad } : undefined
    });
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener hoteles';
    throw new Error(message);
  }
}

/**
 * #25BUG — Función muerta: `getHotelById` no se importa en ninguna pantalla.
 * `pages/Destino.jsx` trabaja siempre con la lista que devuelve `getHoteles(ciudad)`
 * y no existe una vista de detalle de hotel, así que nunca se pide uno por su id.
 *
 * Verificado: 0 importaciones en `pages/` y `components/`.
 */
export async function getHotelById(id) {
  try {
    const resp = await api.get(`/hoteles/${id}`);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener hotel';
    throw new Error(message);
  }
}

