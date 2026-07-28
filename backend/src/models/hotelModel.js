const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ciudad: { type: String, required: true },
  direccion: { type: String, required: true },
  descripcion: { type: String },
  telefono: { type: String },
  email: { type: String },
  precioPromedio: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hotel', HotelSchema);

