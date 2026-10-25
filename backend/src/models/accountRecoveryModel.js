const mongoose = require('mongoose');

const AccountRecoverySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: ['account', 'password'], default: 'account' },
  codeHash: { type: String, required: true },
  // Sin `index: true`: el índice de este campo es el TTL declarado abajo. Con los
  // dos, MongoDB intentaba crear dos índices `expiresAt_1` con opciones distintas,
  // solo uno llegaba a existir y, si era el normal, los códigos caducados no se
  // borraban nunca de la colección.
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: { type: Date }
}, { timestamps: true });

AccountRecoverySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccountRecovery', AccountRecoverySchema);
