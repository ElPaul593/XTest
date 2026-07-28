const mongoose = require('mongoose');

/**
 * Hold (reserva temporal de asiento).
 * Antes vivía en un Map en memoria del proceso: se perdía al reiniciar y no se
 * compartía entre instancias (inservible en serverless/escalado horizontal).
 * Ahora se persiste en Mongo con un índice TTL que expira los holds automáticamente.
 */
const HoldSchema = new mongoose.Schema({
  rutaId: { type: String, required: true },
  fecha: { type: String, required: true },
  asiento: { type: Number, required: true },
  userId: { type: String, default: 'guest' },
  holdId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Un asiento concreto (ruta+fecha+asiento) solo puede tener un hold activo.
HoldSchema.index({ rutaId: 1, fecha: 1, asiento: 1 }, { unique: true });

// Índice TTL: MongoDB elimina el documento cuando expiresAt vence (sin setInterval).
HoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Hold', HoldSchema);
