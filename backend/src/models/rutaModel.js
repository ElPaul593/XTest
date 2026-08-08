const mongoose = require('mongoose');

const RutaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  seats: { type: Number, required: true, default: 40 },
  price: { type: Number, required: true, min: 3, max: 20 },
  duration: { type: String, required: true },
  horaSalida: { type: String, default: '08:00' },
  polyline: { type: String, default: null },
  duracionEstimada: { type: Number, default: null },
  mapNoDisponible: { type: Boolean, default: false },
  mapNoDisponibleAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ruta', RutaSchema);
