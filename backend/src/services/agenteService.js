const mongoose = require('mongoose');
const Reserva = require('../models/reservaModel');
const Ruta = require('../models/rutaModel');
const AppError = require('../utils/AppError');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Lógica de negocio para el Agente de Turismo: ver rutas asignadas,
 * listar pasajeros y verificar boletos (control de abordaje vía QR o manual).
 *
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: reglas de verificación/control de boletos para agentes.
 */

/**
 * Extrae el ID de la reserva desde el contenido escaneado del QR.
 * El QR del boleto codifica un JSON { boleto, ruta, asientos, ... } donde
 * `boleto` es el ID de la reserva. También acepta el ID directo (texto plano).
 */
function parseReservaId(codigo) {
  if (!codigo) return null;
  const raw = String(codigo).trim();
  try {
    const obj = JSON.parse(raw);
    if (obj && (obj.boleto || obj.reserva || obj.id)) {
      return String(obj.boleto || obj.reserva || obj.id);
    }
  } catch (_) {
    // No era JSON: se asume que es el ID directo.
  }
  return raw;
}

/**
 * Determina las rutas que el agente puede controlar.
 * - admin: todas las rutas.
 * - agente con rutas asignadas: solo esas.
 * - agente sin rutas asignadas: todas (fallback para que el flujo sea usable
 *   de inmediato; se marca con `fallback: true`).
 */
async function resolveRutaScope(agent) {
  const role = String(agent.role || '').toLowerCase();
  const assigned = Array.isArray(agent.assignedRutas)
    ? agent.assignedRutas.map((r) => String(r._id || r))
    : [];

  if (role === 'admin' || assigned.length === 0) {
    const all = await Ruta.find().select('_id').lean();
    return { ids: all.map((r) => String(r._id)), fallback: role !== 'admin' && assigned.length === 0 };
  }
  return { ids: assigned, fallback: false };
}

function passengerName(reserva) {
  const u = reserva.user;
  if (u && typeof u === 'object') {
    return `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Pasajero';
  }
  return 'Pasajero';
}

function getSeats(reserva) {
  if (Array.isArray(reserva.seatNumbers) && reserva.seatNumbers.length > 0) return reserva.seatNumbers;
  return reserva.seatNumber ? [reserva.seatNumber] : [];
}

function serializePasajero(reserva) {
  const u = reserva.user && typeof reserva.user === 'object' ? reserva.user : null;
  return {
    reservaId: String(reserva._id || reserva.id),
    nombre: passengerName(reserva),
    cedula: u ? (u.cedula || u.pasaporte || null) : null,
    asientos: getSeats(reserva),
    status: reserva.status,
    verificado: !!(reserva.checkIn && reserva.checkIn.verified),
    verifiedAt: reserva.checkIn ? reserva.checkIn.verifiedAt || null : null
  };
}

/** Lista las rutas asignadas al agente con conteo de pasajeros / verificados / pendientes. */
exports.getRutas = async (agent) => {
  const { ids, fallback } = await resolveRutaScope(agent);
  const rutas = await Ruta.find({ _id: { $in: ids } }).sort({ from: 1, to: 1 }).lean();

  const result = await Promise.all(
    rutas.map(async (ruta) => {
      const reservas = await Reserva.find({ ruta: ruta._id, status: 'reserved' })
        .select('checkIn')
        .lean();
      const totalPasajeros = reservas.length;
      const verificados = reservas.filter((r) => r.checkIn && r.checkIn.verified).length;
      return {
        id: String(ruta._id),
        name: ruta.name || `${ruta.from} - ${ruta.to}`,
        from: ruta.from,
        to: ruta.to,
        duration: ruta.duration,
        price: ruta.price,
        totalPasajeros,
        verificados,
        pendientes: totalPasajeros - verificados
      };
    })
  );

  return { rutas: result, fallback };
};

/** Lista los pasajeros (reservas activas) de una ruta con su estado de verificación. */
exports.getPasajeros = async (agent, rutaId) => {
  if (!mongoose.Types.ObjectId.isValid(rutaId)) throw new AppError('ID de ruta inválido', 400);
  const ruta = await Ruta.findById(rutaId).lean();
  if (!ruta) throw new AppError('Ruta no encontrada', 404);

  const reservas = await Reserva.find({ ruta: rutaId, status: 'reserved' })
    .populate('user', 'nombre apellido cedula pasaporte')
    .sort({ createdAt: 1 })
    .lean();

  const pasajeros = reservas.map(serializePasajero);
  const verificados = pasajeros.filter((p) => p.verificado).length;

  return {
    ruta: {
      id: String(ruta._id),
      name: ruta.name || `${ruta.from} - ${ruta.to}`,
      from: ruta.from,
      to: ruta.to,
      duration: ruta.duration
    },
    pasajeros,
    resumen: {
      total: pasajeros.length,
      verificados,
      pendientes: pasajeros.length - verificados
    }
  };
};

/**
 * Verifica un boleto a partir del contenido del QR (o ID de reserva).
 * Marca el abordaje (checkIn) de forma idempotente: si ya estaba verificado,
 * lo informa sin volver a marcarlo.
 */
exports.verificar = async (agent, codigo) => {
  const reservaId = parseReservaId(codigo);
  if (!reservaId || !mongoose.Types.ObjectId.isValid(reservaId)) {
    throw new AppError('Código de boleto inválido. Escanea un QR válido.', 400);
  }

  const reserva = await Reserva.findById(reservaId)
    .populate('user', 'nombre apellido cedula pasaporte')
    .populate('ruta', 'from to duration price name');
  if (!reserva) throw new AppError('Boleto no encontrado', 404);

  const rutaId = reserva.ruta ? String(reserva.ruta._id || reserva.ruta) : null;
  const { ids } = await resolveRutaScope(agent);
  const pertenece = rutaId ? ids.includes(rutaId) : false;

  const base = {
    pasajero: passengerName(reserva),
    cedula: reserva.user && typeof reserva.user === 'object'
      ? (reserva.user.cedula || reserva.user.pasaporte || null)
      : null,
    ruta: reserva.ruta && typeof reserva.ruta === 'object'
      ? { id: rutaId, from: reserva.ruta.from, to: reserva.ruta.to, name: reserva.ruta.name }
      : null,
    asientos: getSeats(reserva),
    pertenece,
    reservaId: String(reserva._id)
  };

  if (reserva.status === 'cancelled') {
    return { ...base, estado: 'CANCELADO', mensaje: 'Este boleto fue CANCELADO. No es válido.' };
  }

  if (reserva.checkIn && reserva.checkIn.verified) {
    return {
      ...base,
      estado: 'YA_VERIFICADO',
      verifiedAt: reserva.checkIn.verifiedAt,
      mensaje: 'Este boleto ya había sido verificado.'
    };
  }

  reserva.checkIn = { verified: true, verifiedAt: new Date(), verifiedBy: agent._id };
  await reserva.save();

  return {
    ...base,
    estado: 'VERIFICADO',
    verifiedAt: reserva.checkIn.verifiedAt,
    mensaje: pertenece
      ? 'Boleto verificado correctamente.'
      : 'Boleto válido, pero NO pertenece a tus rutas asignadas.'
  };
};

/** Control manual: marca o desmarca el abordaje de un pasajero (por nombre/lista). */
exports.toggle = async (agent, reservaId, verified) => {
  if (!mongoose.Types.ObjectId.isValid(reservaId)) throw new AppError('ID de reserva inválido', 400);
  const reserva = await Reserva.findById(reservaId).populate('user', 'nombre apellido cedula pasaporte');
  if (!reserva) throw new AppError('Reserva no encontrada', 404);

  if (verified) {
    reserva.checkIn = { verified: true, verifiedAt: new Date(), verifiedBy: agent._id };
  } else {
    reserva.checkIn = { verified: false, verifiedAt: null, verifiedBy: null };
  }
  await reserva.save();
  return serializePasajero(reserva);
};
