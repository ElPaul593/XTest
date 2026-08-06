const Joi = require('joi');

/**
 * Schemas de validación para Auth
 */
const authSchemas = {
  register: Joi.object({
    cedula: Joi.string().min(6).max(10).pattern(/^\d+$/).optional(),
    pasaporte: Joi.string().min(6).max(20).optional(),
    email: Joi.string().email().required(),
    nombre: Joi.string().required().min(2).max(50),
    apellido: Joi.string().required().min(2).max(50),
    telefono: Joi.string().required().min(10).max(15).pattern(/^\d+$/),
    paisOrigen: Joi.string().required().min(2).max(50),
    provincia: Joi.string().optional().max(50),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('ADMIN', 'USER').optional()
  }).or('cedula', 'pasaporte'),

  login: Joi.object({
    cedula: Joi.string().optional(),
    pasaporte: Joi.string().optional(),
    password: Joi.string().required()
  }).or('cedula', 'pasaporte')
};

/**
 * Schemas de validación para gestión de usuarios (Admin)
 */
const userSchemas = {
  create: Joi.object({
    cedula: Joi.string().min(6).max(10).pattern(/^\d+$/).optional(),
    pasaporte: Joi.string().min(6).max(20).optional(),
    email: Joi.string().email().required(),
    nombre: Joi.string().required().min(2).max(50),
    apellido: Joi.string().required().min(2).max(50),
    telefono: Joi.string().required().min(10).max(15).pattern(/^\d+$/),
    paisOrigen: Joi.string().optional().min(2).max(50),
    provincia: Joi.string().optional().max(50),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('ADMIN', 'USER', 'AGENTE').optional(),
    assignedRutas: Joi.array().items(Joi.string()).optional()
  }).or('cedula', 'pasaporte'),

  update: Joi.object({
    email: Joi.string().email().optional(),
    nombre: Joi.string().min(2).max(50).optional(),
    apellido: Joi.string().min(2).max(50).optional(),
    telefono: Joi.string().min(10).max(15).pattern(/^\d+$/).optional(),
    provincia: Joi.string().max(50).optional(),
    password: Joi.string().min(6).allow('').optional(),
    role: Joi.string().valid('ADMIN', 'USER', 'AGENTE').optional(),
    assignedRutas: Joi.array().items(Joi.string()).optional()
  })
};

/**
 * Schemas de validación para Reservas
 */
const reservaSchemas = {
  create: Joi.object({
    ruta: Joi.string().required(),
    // Soporta un solo asiento o múltiples
    seatNumber: Joi.number().integer().min(1).optional(),
    seatNumbers: Joi.array().items(Joi.number().integer().min(1)).optional(),
    status: Joi.string().valid('reserved', 'cancelled').optional(),
    isQuickReservation: Joi.boolean().optional(),
    tipo: Joi.string().valid('NORMAL', 'RAPIDA').optional(),
    fecha: Joi.string().optional(),
    pricing: Joi.object({
      cantidad: Joi.number().optional(),
      precioUnitario: Joi.number().optional(),
      subtotal: Joi.number().optional(),
      porcentajeDescuento: Joi.number().optional(),
      montoDescuento: Joi.number().optional(),
      total: Joi.number().optional(),
      ahorros: Joi.number().optional(),
      // Campos legacy
      precioBase: Joi.number().optional(),
      descuento: Joi.number().optional(),
      recargo: Joi.number().optional(),
      totalPagar: Joi.number().optional(),
      motivoDescuento: Joi.string().allow(null, '').optional(),
      motivoRecargo: Joi.string().allow(null, '').optional()
    }).optional()
  }).or('seatNumber', 'seatNumbers'), // Requiere uno de los dos

  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    status: Joi.string().valid('reserved', 'cancelled').optional(),
    userId: Joi.string().optional(),
    from: Joi.date().optional(),
    to: Joi.date().optional()
  })
};

/**
 * Schemas de validación para Boletos
 */
const boletoSchemas = {
  create: Joi.object({
    reserva: Joi.string().required(),
    seatNumber: Joi.number().integer().min(1).required(),
    price: Joi.number().positive().optional()
  })
};

/**
 * Schemas de validación para Rutas
 */
const rutaSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(120).optional(),
    from: Joi.string().required().min(2).max(50),
    to: Joi.string().required().min(2).max(50),
    price: Joi.number().min(3).max(20).required(),
    duration: Joi.string().required(),
    horaSalida: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    seats: Joi.number().integer().min(1).max(80).optional(),
  }),

  query: Joi.object({
    from: Joi.string().optional(),
    to: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
  })
};

/**
 * Schemas de validación para Hoteles
 */
const hotelSchemas = {
  create: Joi.object({
    nombre: Joi.string().required().min(2).max(120),
    ciudad: Joi.string().required().min(2).max(60),
    direccion: Joi.string().required().min(2).max(200),
    descripcion: Joi.string().allow('').max(1000).optional(),
    telefono: Joi.string().allow('').max(20).optional(),
    email: Joi.string().allow('').email().optional(),
    precioPromedio: Joi.number().min(0).optional(),
    googlePlaceId: Joi.string().optional(),
    ratingGoogle: Joi.number().min(0).max(5).optional(),
    totalRatingsGoogle: Joi.number().integer().min(0).optional(),
    fotoUrl: Joi.string().allow('').max(500).optional(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
    fechaSincronizacion: Joi.date().optional()
  }),

  update: Joi.object({
    nombre: Joi.string().min(2).max(120).optional(),
    ciudad: Joi.string().min(2).max(60).optional(),
    direccion: Joi.string().min(2).max(200).optional(),
    descripcion: Joi.string().allow('').max(1000).optional(),
    telefono: Joi.string().allow('').max(20).optional(),
    email: Joi.string().allow('').email().optional(),
    precioPromedio: Joi.number().min(0).optional(),
    googlePlaceId: Joi.string().optional(),
    ratingGoogle: Joi.number().min(0).max(5).optional(),
    totalRatingsGoogle: Joi.number().integer().min(0).optional(),
    fotoUrl: Joi.string().allow('').max(500).optional(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
    fechaSincronizacion: Joi.date().optional()
  })
};

/**
 * Schemas de validación para Lugares Turísticos
 */
const lugarTuristicoSchemas = {
  create: Joi.object({
    nombre: Joi.string().required().min(2).max(120),
    ciudad: Joi.string().required().min(2).max(60),
    direccion: Joi.string().required().min(2).max(200),
    descripcion: Joi.string().allow('').max(1000).optional(),
    tipo: Joi.string().valid('Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro').optional(),
    horario: Joi.string().allow('').max(120).optional(),
    precioEntrada: Joi.number().min(0).optional(),
    imagen: Joi.string().allow('').max(500).optional()
  }),

  update: Joi.object({
    nombre: Joi.string().min(2).max(120).optional(),
    ciudad: Joi.string().min(2).max(60).optional(),
    direccion: Joi.string().min(2).max(200).optional(),
    descripcion: Joi.string().allow('').max(1000).optional(),
    tipo: Joi.string().valid('Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro').optional(),
    horario: Joi.string().allow('').max(120).optional(),
    precioEntrada: Joi.number().min(0).optional(),
    imagen: Joi.string().allow('').max(500).optional()
  })
};

/**
 * Schemas de validación para Calificaciones
 * Los nombres de campo coinciden con el modelo: calificacion, recomendacion.
 */
const calificacionSchemas = {
  create: Joi.object({
    tipo: Joi.string().valid('hotel', 'lugarTuristico').required(),
    referencia: Joi.string().required(),
    calificacion: Joi.number().integer().min(1).max(5).required(),
    recomendacion: Joi.string().allow('').max(500).optional()
  }),

  update: Joi.object({
    calificacion: Joi.number().integer().min(1).max(5).optional(),
    recomendacion: Joi.string().allow('').max(500).optional()
  }),

  query: Joi.object({
    tipo: Joi.string().optional(),
    referencia: Joi.string().optional(),
    usuario: Joi.string().optional()
  })
};

module.exports = {
  authSchemas,
  userSchemas,
  reservaSchemas,
  boletoSchemas,
  rutaSchemas,
  hotelSchemas,
  lugarTuristicoSchemas,
  calificacionSchemas
};
