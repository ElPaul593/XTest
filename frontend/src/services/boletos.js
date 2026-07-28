import api from './api';

/**
 * Lista todos los boletos emitidos (Admin).
 * Endpoint: GET /api/boletos -> { data: [...] }
 */
export async function getBoletos() {
  try {
    const response = await api.get('/boletos');
    return response.data?.data || response.data || [];
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al obtener boletos');
  }
}

/**
 * Emite un boleto a partir de una reserva (Admin).
 * El backend calcula el precio según la estrategia de pricing.
 * @param {{ reserva: string, seatNumber: number }} data
 */
export async function createBoleto(data) {
  try {
    const response = await api.post('/boletos', data);
    return response.data?.data || response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al emitir el boleto');
  }
}
