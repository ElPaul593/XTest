const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ciudad: { type: String, required: true },
  direccion: { type: String, required: true },
  descripcion: { type: String },
  telefono: { type: String },
  email: { type: String },
  precioPromedio: { type: Number },
  googlePlaceId: { type: String, unique: true, sparse: true },
  ratingGoogle: { type: Number },
  totalRatingsGoogle: { type: Number },
  fotoUrl: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  fechaSincronizacion: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

HotelSchema.index({ ciudad: 1 });
HotelSchema.index({ googlePlaceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Hotel', HotelSchema);

