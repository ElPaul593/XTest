import api from './api';

/**
 * Servicio del Agente de Turismo: rutas asignadas, pasajeros y verificación de boletos.
 * Todas las peticiones usan el token (interceptor global en ./api).
 */

/** Rutas asignadas al agente con conteo de pasajeros/verificados/pendientes. */
export async function getRutasAsignadas() {
  try {
    const res = await api.get('/agente/rutas');
    return res.data; // { rutas: [...], fallback: bool }
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener rutas asignadas');
  }
}

/** Lista de pasajeros de una ruta con su estado de verificación. */
export async function getPasajeros(rutaId) {
  try {
    const res = await api.get(`/agente/rutas/${rutaId}/pasajeros`);
    return res.data; // { ruta, pasajeros, resumen }
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener pasajeros');
  }
}

/**
 * Verifica un boleto a partir del contenido escaneado del QR (o ID de reserva).
 * @param {string} codigo - JSON del QR o ID de la reserva.
 */
export async function verificarBoleto(codigo) {
  try {
    const res = await api.post('/agente/verificar', { codigo });
    return res.data; // { estado, pasajero, ruta, asientos, pertenece, mensaje, ... }
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al verificar el boleto');
  }
}

/** Control manual: marca/desmarca el abordaje de un pasajero. */
export async function togglePasajero(rutaId, reservaId, verified) {
  try {
    const res = await api.post(`/agente/rutas/${rutaId}/pasajeros/${reservaId}/toggle`, { verified });
    return res.data; // pasajero actualizado
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al actualizar el pasajero');
  }
}
