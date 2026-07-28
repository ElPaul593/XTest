const mongoose = require('mongoose');

const ReservaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ruta: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', required: true },
  // Soporta un solo asiento (legacy) o múltiples
  seatNumber: { type: Number }, // Legacy - un solo asiento
  seatNumbers: [{ type: Number }], // Nuevo - múltiples asientos
  status: { type: String, enum: ['reserved', 'cancelled'], default: 'reserved' },
  isQuickReservation: { type: Boolean, default: false },
  tipo: { type: String, enum: ['NORMAL', 'RAPIDA'], default: 'NORMAL' },
  fecha: { type: String }, // Fecha del viaje (para compatibilidad con API externa)
  // Nuevo formato de pricing (desde API externa)
  pricing: {
    cantidad: { type: Number },
    precioUnitario: { type: Number },
    subtotal: { type: Number },
    porcentajeDescuento: { type: Number, default: 0 },
    montoDescuento: { type: Number, default: 0 },
    total: { type: Number },
    ahorros: { type: Number, default: 0 }
  },
  // Legacy pricing (compatibilidad)
  precio: {
    precioBase: { type: Number },
    descuento: { type: Number, default: 0 },
    recargo: { type: Number, default: 0 },
    totalPagar: { type: Number },
    motivoDescuento: { type: String },
    motivoRecargo: { type: String }
  },
  // Control de abordaje / verificación por el Agente de Turismo (escaneo de QR o control manual).
  checkIn: {
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  createdAt: { type: Date, default: Date.now }
});

// Virtual para obtener todos los asientos (compatibilidad)
ReservaSchema.virtual('allSeats').get(function () {
  if (this.seatNumbers && this.seatNumbers.length > 0) {
    return this.seatNumbers;
  }
  return this.seatNumber ? [this.seatNumber] : [];
});

// Asegurar que siempre haya al menos un asiento
ReservaSchema.pre('save', function () {
  // En Mongoose 9, este hook se ejecuta sin callback `next`
  if (this.seatNumbers && this.seatNumbers.length > 0 && !this.seatNumber) {
    this.seatNumber = this.seatNumbers[0];
  }
  if (this.seatNumber && (!this.seatNumbers || this.seatNumbers.length === 0)) {
    this.seatNumbers = [this.seatNumber];
  }
});

module.exports = mongoose.model('Reserva', ReservaSchema);
