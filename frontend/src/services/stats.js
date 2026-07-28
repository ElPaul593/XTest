import api from './api';

/**
 * Estadísticas agregadas de reservas (Admin).
 * Endpoint: GET /api/stats/reservas -> { data: { general, porRuta, porMes, periodo } }
 */
export async function getReservasStats({ from, to } = {}) {
  try {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    const response = await api.get(`/stats/reservas${qs ? `?${qs}` : ''}`);
    return response.data?.data || response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al obtener estadísticas');
  }
}
