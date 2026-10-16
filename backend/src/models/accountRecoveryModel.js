const mongoose = require('mongoose');

const AccountRecoverySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: ['account', 'password'], default: 'account' },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  usedAt: { type: Date }
}, { timestamps: true });

AccountRecoverySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccountRecovery', AccountRecoverySchema);
