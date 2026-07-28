const mongoose = require('mongoose');

const LugarTuristicoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ciudad: { type: String, required: true },
  direccion: { type: String, required: true },
  descripcion: { type: String },
  tipo: { type: String, enum: ['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro'], default: 'Otro' },
  horario: { type: String },
  precioEntrada: { type: Number, default: 0 },
  imagen: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LugarTuristico', LugarTuristicoSchema);

