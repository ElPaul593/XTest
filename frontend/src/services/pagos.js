import api from './api';

function mensajeDeError(err, respaldo) {
  return err.response?.data?.message || err.response?.data?.error || err.message || respaldo;
}

async function solicitar(peticion, respaldo) {
  try {
    const response = await peticion();
    return response.data;
  } catch (err) {
    throw new Error(mensajeDeError(err, respaldo));
  }
}

export const crearOrdenPago = (holdIds) =>
  solicitar(() => api.post('/pagos/crear-orden', { holdIds }), 'No se pudo iniciar el pago');

export const capturarPago = (orderId) =>
  solicitar(() => api.post('/pagos/capturar-orden', { orderId }), 'No se pudo confirmar el pago');

export const getResumenFinanciero = () =>
  solicitar(() => api.get('/pagos/admin/resumen'), 'No se pudo cargar el resumen financiero');

export const getPagosPendientes = () =>
  solicitar(() => api.get('/pagos/admin/pendientes'), 'No se pudieron cargar los pagos pendientes');

export const aprobarPago = (orderId) =>
  solicitar(() => api.post(`/pagos/admin/${encodeURIComponent(orderId)}/aprobar`), 'No se pudo aprobar el pago');

export const rechazarPago = (orderId, motivo) =>
  solicitar(() => api.post(`/pagos/admin/${encodeURIComponent(orderId)}/rechazar`, { motivo }), 'No se pudo rechazar el pago');
