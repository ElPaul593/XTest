import api from './api';

// Función para obtener headers de autorización
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Obtiene todas las reservas del sistema (Admin)
 * Endpoint: GET /api/reservas
 */
export async function getAllReservations(page = 1, limit = 10, filters = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await api.get(`/reservas?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching all reservations:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener todas las reservas');
  }
}

/**
 * Obtiene las reservas del usuario autenticado
 * Endpoint: GET /api/reservas/mine
 */
export async function getUserReservations(page = 1, limit = 10) {
  try {
    const response = await api.get(`/reservas/mine?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching reservations:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener mis reservas');
  }
}

/**
 * Crea una nueva reserva
 * Endpoint: POST /api/reservas
 */
export async function createReserva(reservaData) {
  try {
    const response = await api.post('/reservas', reservaData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    console.error('Error creating reservation:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al crear la reserva');
  }
}

/**
 * Cancela una reserva existente
 * Endpoint: DELETE /api/reservas/:id
 */
export async function cancelReserva(id) {
  try {
    const response = await api.delete(`/reservas/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al cancelar la reserva');
  }
}

/**
 * Crea UNA SOLA reserva con múltiples asientos
 * Endpoint: POST /api/reservas
 * 
 * @param {Object} data - Datos de la reserva
 * @param {string} data.ruta - ID de la ruta
 * @param {number[]} data.asientos - Array de números de asientos
 * @param {string} data.fecha - Fecha del viaje
 * @param {Object} data.pricing - Información de pricing de la API
 * @param {string} data.tipo - "NORMAL" | "RAPIDA"
 */
export async function createMultiSeatReserva({ ruta, asientos, fecha, pricing, tipo = 'NORMAL' }) {
  try {
    // Crear UNA reserva con todos los asientos
    const reservaData = {
      ruta,
      seatNumbers: asientos, // Array de asientos
      fecha,
      pricing: pricing ? {
        cantidad: pricing.cantidad || asientos.length,
        precioUnitario: pricing.precioBase || pricing.precioUnitario,
        subtotal: pricing.precioBaseTotal || pricing.subtotal,
        porcentajeDescuento: pricing.porcentajeDescuento || 0,
        montoDescuento: pricing.descuentoTotal || pricing.montoDescuento || 0,
        total: pricing.totalPagar || pricing.total,
        ahorros: pricing.ahorros || 0
      } : null,
      isQuickReservation: tipo === 'RAPIDA',
      tipo
    };

    console.log('[ReservasService] Creando reserva multi-asiento:', reservaData);

    const response = await api.post('/reservas', reservaData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (err) {
    console.error('[ReservasService] Error creating multi-seat reservation:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al crear la reserva');
  }
}

