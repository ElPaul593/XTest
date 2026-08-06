/**
 * DTOs (Data Transfer Objects) para serialización consistente
 * Evita devolver documentos completos de Mongoose
 */

/**
 * Serializa un usuario eliminando campos sensibles
 */
const serializeUser = (user) => {
  if (!user) return null;
  
  const userObj = user.toObject ? user.toObject() : user;
  
  return {
    id: userObj._id || userObj.id,
    cedula: userObj.cedula || null,
    pasaporte: userObj.pasaporte || null,
    email: userObj.email || null,
    nombre: userObj.nombre,
    apellido: userObj.apellido,
    telefono: userObj.telefono,
    paisOrigen: userObj.paisOrigen,
    provincia: userObj.provincia || null,
    role: userObj.role,
    assignedRutas: Array.isArray(userObj.assignedRutas)
      ? userObj.assignedRutas.map((r) => {
          const rutaId = r && typeof r === 'object' && r._id ? r._id : r;
          return String(rutaId);
        })
      : [],
    createdAt: userObj.createdAt
  };
};

/**
 * Serializa una ruta
 */
const serializeRuta = (ruta) => {
  if (!ruta) return null;
  
  const rutaObj = ruta.toObject ? ruta.toObject() : ruta;
  
  return {
    id: rutaObj._id || rutaObj.id,
    from: rutaObj.from,
    to: rutaObj.to,
    price: rutaObj.price,
    duration: rutaObj.duration,
    horaSalida: rutaObj.horaSalida,
    polyline: rutaObj.polyline,
    duracionEstimada: rutaObj.duracionEstimada,
    seats: rutaObj.seats,
    createdAt: rutaObj.createdAt
  };
};

/**
 * Serializa una reserva
 */
const serializeReserva = (reserva) => {
  if (!reserva) return null;
  
  const reservaObj = reserva.toObject ? reserva.toObject() : reserva;
  
  const seatNumbers = Array.isArray(reservaObj.seatNumbers) && reservaObj.seatNumbers.length > 0
    ? [...reservaObj.seatNumbers]
    : [];

  if (reservaObj.seatNumber) {
    seatNumbers.push(reservaObj.seatNumber);
  }

  return {
    id: reservaObj._id || reservaObj.id,
    user: typeof reservaObj.user === 'object' && reservaObj.user
      ? serializeUser(reservaObj.user)
      : reservaObj.user,
    ruta: typeof reservaObj.ruta === 'object' && reservaObj.ruta
      ? serializeRuta(reservaObj.ruta)
      : reservaObj.ruta,
    seatNumber: reservaObj.seatNumber,
    seatNumbers,
    status: reservaObj.status,
    tipo: reservaObj.tipo,
    isQuickReservation: reservaObj.isQuickReservation,
    fecha: reservaObj.fecha,
    pricing: reservaObj.pricing || null,
    precio: reservaObj.precio || null,
    createdAt: reservaObj.createdAt
  };
};

/**
 * Serializa un boleto
 */
const serializeBoleto = (boleto) => {
  if (!boleto) return null;
  
  const boletoObj = boleto.toObject ? boleto.toObject() : boleto;
  
  return {
    id: boletoObj._id || boletoObj.id,
    reserva: typeof boletoObj.reserva === 'object' && boletoObj.reserva
      ? serializeReserva(boletoObj.reserva)
      : boletoObj.reserva,
    seatNumber: boletoObj.seatNumber,
    price: boletoObj.price,
    issuedAt: boletoObj.issuedAt
  };
};

/**
 * Serializa una calificación
 */
const serializeCalificacion = (calificacion) => {
  if (!calificacion) return null;
  
  const calObj = calificacion.toObject ? calificacion.toObject() : calificacion;
  
  return {
    id: calObj._id || calObj.id,
    usuario: typeof calObj.usuario === 'object' && calObj.usuario
      ? serializeUser(calObj.usuario)
      : calObj.usuario,
    tipo: calObj.tipo,
    referencia: calObj.referencia,
    calificacion: calObj.calificacion,
    recomendacion: calObj.recomendacion,
    fecha: calObj.fecha,
    createdAt: calObj.createdAt
  };
};

module.exports = {
  serializeUser,
  serializeReserva,
  serializeBoleto,
  serializeRuta,
  serializeCalificacion
};

