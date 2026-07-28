const mongoose = require('mongoose');
const Reserva = require('../models/reservaModel');
const AppError = require('../utils/AppError');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de reservas.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: operaciones CRUD para reservas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Reserva.
 */

/**
 * Busca todas las reservas con paginación y filtros
 * @param {object} options - Opciones de paginación y filtros
 * @param {number} options.page - Número de página (default: 1)
 * @param {number} options.limit - Límite de resultados por página (default: 10)
 * @param {string} options.status - Filtrar por status (reserved, cancelled)
 * @param {string} options.userId - Filtrar por ID de usuario
 * @param {Date} options.from - Fecha desde
 * @param {Date} options.to - Fecha hasta
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
exports.findAll = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    from,
    to
  } = options;

  // Construir query de filtros
  const query = {};

  if (status) {
    query.status = status;
  }

  if (userId) {
    query.user = userId;
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  // Calcular skip
  const skip = (page - 1) * limit;

  // Ejecutar consulta con paginación
  const [data, total] = await Promise.all([
    Reserva.find(query)
      .populate('user', 'nombre apellido cedula pasaporte')
      .populate('ruta', 'from to price duration')
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Reserva.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
};

/**
 * Crea una reserva validando disponibilidad de asientos de forma ATÓMICA.
 * Antes solo guardaba sin comprobar nada (permitía doble reserva del mismo asiento).
 * Ahora:
 *   - normaliza los asientos solicitados (seatNumber/seatNumbers),
 *   - dentro de una transacción comprueba que ningún asiento esté ya 'reserved'
 *     en la misma ruta (y misma fecha si se envía), y luego inserta.
 * Lanza un error 409 si hay conflicto.
 */
exports.create = async (data) => {
  const requestedSeats = Array.isArray(data.seatNumbers) && data.seatNumbers.length > 0
    ? data.seatNumbers.map(Number)
    : (data.seatNumber ? [Number(data.seatNumber)] : []);

  if (requestedSeats.length === 0) {
    throw new AppError('Debe especificar al menos un asiento', 400);
  }

  const conflictQuery = {
    ruta: data.ruta,
    status: 'reserved',
    $or: [
      { seatNumbers: { $in: requestedSeats } },
      { seatNumber: { $in: requestedSeats } }
    ]
  };
  if (data.fecha) conflictQuery.fecha = data.fecha;

  const runCreate = async (session) => {
    const opts = session ? { session } : undefined;
    const conflict = await Reserva.findOne(conflictQuery, null, opts).lean();
    if (conflict) {
      throw new AppError('Uno o más asientos ya están reservados para esta ruta y fecha', 409);
    }
    const docs = await Reserva.create([data], opts || {});
    return docs[0];
  };

  // Intento transaccional (Atlas es replica set y lo soporta). Si el entorno no
  // soporta transacciones, se hace el check+create sin sesión como mejor esfuerzo.
  let session;
  try {
    session = await mongoose.startSession();
    let created;
    await session.withTransaction(async () => {
      created = await runCreate(session);
    });
    return created;
  } catch (err) {
    if (err && err.statusCode) throw err; // conflicto/validación: propagar
    const transactionsUnsupported =
      /Transaction numbers|replica set|not supported|Transactions are not supported/i.test(String(err.message || ''));
    if (transactionsUnsupported) {
      return runCreate(null);
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

exports.findById = async (id) => {
  return Reserva.findById(id).populate('user').populate('ruta');
};

exports.cancel = async (id) => {
  return Reserva.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
};
