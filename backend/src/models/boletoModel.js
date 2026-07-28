const mongoose = require('mongoose');

const BoletoSchema = new mongoose.Schema({
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  seatNumber: { type: Number, required: true },
  price: { type: Number, required: true },
  issuedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Boleto', BoletoSchema);
