const axios = require('axios');
const Pago = require('../models/pagoModel');
const Reserva = require('../models/reservaModel');
const AppError = require('../utils/AppError');
const { resumirMovimientos } = require('../utils/finanzas');
const { seatApiUrl, PAGO_REQUEST_TIMEOUT_MS } = require('../config/externalApis');

const encabezadoAdmin = () => {
  const token = process.env.SEAT_API_ADMIN_TOKEN;
  return token ? { 'x-admin-token': token } : {};
};

/** Llama a la API de asientos y convierte sus fallos en errores legibles. */
async function llamarApi(metodo, url, { data, params, headers } = {}) {
  try {
    const response = await axios({ method: metodo, url, data, params, headers, timeout: PAGO_REQUEST_TIMEOUT_MS });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new AppError(error.response.data?.error || 'La API de pagos rechazó la operación', error.response.status);
    }
    throw new AppError('No se pudo conectar con la API de pagos', 502);
  }
}

const esOrdenPerdida = (error) => error.statusCode === 404;

async function buscarPagoDelUsuario(orderId, user) {
  const pago = await Pago.findOne({ orderId });
  if (!pago || String(pago.user) !== String(user._id)) {
    throw new AppError('No encontramos ese pago en tu cuenta', 404);
  }
  return pago;
}

async function entregarAsientos(pago) {
  if (pago.reserva) return pago;

  const reserva = await Reserva.create({
    user: pago.user,
    ruta: pago.ruta,
    seatNumbers: pago.asientos,
    fecha: pago.fecha,
    pricing: pago.pricing
  });

  pago.reserva = reserva._id;
  return pago.save();
}

exports.configuracion = () => llamarApi('get', seatApiUrl('checkoutConfiguracion'));

exports.crearOrden = async ({ user, holdIds, origin }) => {
  const destino = origin ? `${origin}/seat-booking` : undefined;
  const orden = await llamarApi('post', seatApiUrl('checkoutCrearOrden'), {
    data: { holdIds, userId: String(user._id), returnUrl: destino, cancelUrl: destino }
  });

  await Pago.create({
    orderId: orden.orderId,
    user: user._id,
    ruta: orden.rutaId,
    fecha: orden.fecha,
    asientos: orden.asientos,
    moneda: orden.cobro?.moneda || 'USD',
    total: Number(orden.cobro?.valor) || orden.pricing?.total || 0,
    pricing: orden.pricing
  });

  return orden;
};

exports.capturarOrden = async ({ user, orderId }) => {
  const pago = await buscarPagoDelUsuario(orderId, user);
  const resultado = await llamarApi('post', seatApiUrl('checkoutCapturarOrden'), {
    data: { orderId, userId: String(user._id) }
  });

  pago.captureId = resultado.captureId;
  pago.pagador = resultado.payer?.email_address || pago.pagador;
  pago.estado = resultado.enRevision ? 'EN_REVISION' : 'PAGADO';
  await pago.save();

  if (!resultado.enRevision) await entregarAsientos(pago);

  return resultado;
};

exports.listarPendientes = () => Pago.find({ estado: 'EN_REVISION' })
  .sort({ createdAt: 1 })
  .populate('user', 'nombre apellido email cedula')
  .populate('ruta', 'from to')
  .lean();

async function buscarEnRevision(orderId) {
  const pago = await Pago.findOne({ orderId });
  if (!pago) throw new AppError('Pago no encontrado', 404);
  if (pago.estado !== 'EN_REVISION') throw new AppError('Ese pago ya no está en revisión', 409);
  return pago;
}

exports.aprobar = async (orderId) => {
  const pago = await buscarEnRevision(orderId);

  try {
    await llamarApi('post', seatApiUrl('adminPagos', `/${encodeURIComponent(orderId)}/aprobar`), {
      headers: encabezadoAdmin()
    });
  } catch (error) {
    // La API pudo reiniciarse y olvidar la orden; el cobro sigue registrado aquí.
    if (!esOrdenPerdida(error)) throw error;
  }

  pago.estado = 'PAGADO';
  await pago.save();
  return entregarAsientos(pago);
};

exports.rechazar = async (orderId, motivo) => {
  const pago = await buscarEnRevision(orderId);

  try {
    await llamarApi('post', seatApiUrl('adminPagos', `/${encodeURIComponent(orderId)}/rechazar`), {
      headers: encabezadoAdmin(),
      data: { motivo }
    });
  } catch (error) {
    if (!esOrdenPerdida(error)) throw error;
  }

  pago.estado = 'RECHAZADO';
  pago.motivoRechazo = motivo;
  return pago.save();
};

exports.resumenFinanciero = async () => {
  const [ventas, ultimasVentas, pendientes, cuenta] = await Promise.all([
    Pago.aggregate([
      { $match: { estado: 'PAGADO' } },
      { $group: { _id: null, total: { $sum: '$total' }, cantidad: { $sum: 1 } } }
    ]),
    Pago.find({ estado: 'PAGADO' })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('ruta', 'from to')
      .lean(),
    Pago.countDocuments({ estado: 'EN_REVISION' }),
    llamarApi('get', seatApiUrl('reportesCuentaPasarela'), { headers: encabezadoAdmin() }).catch(() => null)
  ]);

  const movimientos = cuenta?.movimientos?.movimientos || [];

  return {
    ventas: { total: ventas[0]?.total || 0, cantidad: ventas[0]?.cantidad || 0, ultimas: ultimasVentas },
    pendientes,
    pasarela: cuenta
      ? {
        modo: cuenta.pasarela?.modo,
        saldos: cuenta.saldo?.saldos || [],
        desde: cuenta.movimientos?.desde,
        hasta: cuenta.movimientos?.hasta,
        ...resumirMovimientos(movimientos),
        movimientos: movimientos.slice(-20).reverse()
      }
      : null
  };
};
