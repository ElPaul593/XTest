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
    preferencias: Joi.array().items(Joi.string().valid('Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro')).optional(),
    password: Joi.string().required().min(6)
    // #13BUG CORREGIDO: se quitó `role` de este esquema.
    //
    // Es el esquema del registro PÚBLICO, y `AuthService.register` fuerza
    // `role: 'USER'` sobre cualquier valor recibido. Declararlo aquí hacía creer
    // —también a quien leyera el Swagger de la ruta— que un cliente podía
    // registrarse como ADMIN.
    //
    // Quitarlo no rompe a ningún cliente: el middleware de validación usa
    // `stripUnknown: true`, así que un `role` que llegue en el cuerpo se descarta
    // en silencio en lugar de provocar un 400. El rol sí se puede asignar desde
    // el alta administrativa (`userSchemas.create`), que es donde corresponde.
  }).or('cedula', 'pasaporte'),

  login: Joi.object({
    cedula: Joi.string().optional(),
    pasaporte: Joi.string().optional(),
    password: Joi.string().required()
  }).or('cedula', 'pasaporte'),

  // Inicio de sesión con Google. `credential` es el id_token que entrega
  // Google Identity Services en el navegador.
  google: Joi.object({
    credential: Joi.string().required().messages({
      'any.required': 'Falta el token de Google'
    })
  }),

  // Solicitud del enlace de recuperación de contraseña.
  /**
   * Solicitud del enlace de recuperación.
   *
   * Acepta CUALQUIERA de los tres identificadores. Antes exigía el correo, lo que
   * dejaba sin salida justo al usuario que más lo necesita: el que no recuerda con
   * qué dirección se registró. Con la cédula o el pasaporte se localiza la cuenta
   * y el enlace se envía al correo que tenga guardado.
   */
  forgotPassword: Joi.object({
    email: Joi.string().email().optional().messages({
      'string.email': 'Introduce un correo electrónico válido'
    }),
    cedula: Joi.string().min(6).max(10).pattern(/^\d+$/).optional().messages({
      'string.pattern.base': 'La cédula debe contener solo dígitos'
    }),
    pasaporte: Joi.string().min(6).max(20).optional()
  })
    .or('email', 'cedula', 'pasaporte')
    .messages({
      'object.missing': 'Indica tu correo, tu cédula o tu pasaporte'
    }),

  // Nueva contraseña. El token viaja en la URL, no en el cuerpo.
  resetPassword: Joi.object({
    password: Joi.string().required().min(6).messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
  }),

  // Recuperación de cuenta por CÓDIGO de 6 dígitos (aportado en la rama remota).
  // Es un flujo distinto del reseteo por enlace: sirve para recuperar el acceso a
  // una cuenta bloqueada o dada de baja, no solo para cambiar la contraseña.
  recoveryRequest: Joi.object({
    cedula: Joi.string().min(6).max(10).pattern(/^\d+$/).optional(),
    pasaporte: Joi.string().min(6).max(20).optional(),
    email: Joi.string().email().required(),
    purpose: Joi.string().valid('account', 'password').default('account')
  }).or('cedula', 'pasaporte'),

  recoveryConfirm: Joi.object({
    recoveryId: Joi.string().required(),
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
    password: Joi.string().min(6).required()
  })
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
    preferencias: Joi.array().items(Joi.string().valid('Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro')).optional(),
    password: Joi.string().min(6).allow('').optional(),
    role: Joi.string().valid('ADMIN', 'USER', 'AGENTE').optional(),
    assignedRutas: Joi.array().items(Joi.string()).optional()
  }),

  /**
   * Cambio de estado de la cuenta (bloqueo / reactivación / baja).
   * El motivo es obligatorio al bloquear o dar de baja porque es el texto que ve
   * el usuario cuando intenta iniciar sesión; al reactivar no aplica.
   */
  cambiarEstado: Joi.object({
    estado: Joi.string().valid('ACTIVO', 'BLOQUEADO', 'ELIMINADO').required().messages({
      'any.only': 'El estado debe ser ACTIVO, BLOQUEADO o ELIMINADO',
      'any.required': 'El estado es requerido'
    }),
    motivo: Joi.string().max(300).allow('', null).optional()
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
    from: Joi.string().trim().required().min(2).max(50),
    to: Joi.string().trim().required().min(2).max(50),
    price: Joi.number().min(3).max(20).required(),
    duration: Joi.number().strict().min(1).max(16).required(),
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
