const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipo: { type: String, enum: ['hotel', 'lugarTuristico'], required: true },
  referencia: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID del hotel o lugar turístico
  calificacion: { type: Number, required: true, min: 1, max: 5 },
  recomendacion: { type: String },
  fecha: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
CalificacionSchema.index({ tipo: 1, referencia: 1 });
CalificacionSchema.index({ usuario: 1 });
CalificacionSchema.index({ fecha: -1 });

module.exports = mongoose.model('Calificacion', CalificacionSchema);

