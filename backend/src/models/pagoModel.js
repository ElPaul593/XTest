const mongoose = require('mongoose');

/**
 * Registro durable de cada cobro. La API de asientos guarda sus órdenes en
 * memoria y en Vercel se pierden al reiniciarse la función, así que los ingresos
 * y los pagos en revisión del panel se leen de aquí.
 */
const PagoSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ruta: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta' },
  fecha: { type: String },
  asientos: [{ type: Number }],
  estado: {
    type: String,
    enum: ['CREADA', 'EN_REVISION', 'PAGADO', 'RECHAZADO'],
    default: 'CREADA'
  },
  captureId: { type: String },
  pagador: { type: String },
  moneda: { type: String, default: 'USD' },
  total: { type: Number, default: 0 },
  pricing: { type: mongoose.Schema.Types.Mixed },
  motivoRechazo: { type: String },
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva' }
}, { timestamps: true });

PagoSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.model('Pago', PagoSchema);
