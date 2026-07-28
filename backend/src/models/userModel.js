const mongoose = require('mongoose');

/**
 * PATRÓN DE DISEÑO: Repository Pattern (Modelo)
 * Este modelo define la estructura de datos para usuarios.
 * Separa la definición del esquema de la lógica de acceso a datos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Esta clase tiene una única responsabilidad: definir el esquema y validaciones
 * del modelo User. No maneja lógica de negocio ni acceso a datos.
 */
const UserSchema = new mongoose.Schema({
  cedula: { 
    type: String, 
    required: function() { return !this.pasaporte; }, 
    unique: true, 
    sparse: true,
    minlength: 6, 
    maxlength: 10, 
    match: [/^\d+$/, 'cedula must be digits only'] 
  },

  pasaporte: { 
    type: String, 
    required: function() { return !this.cedula; },
    unique: true,
    sparse: true,
    minlength: 6,
    maxlength: 20
  },

  nombre: { type: String, required: true },
  apellido: { type: String, required: true },

  telefono: { 
    type: String, 
    required: true, 
    minlength: [10, 'El teléfono necesita 10 dígitos'], 
    maxlength: [15, 'El teléfono no puede tener más de 15 dígitos'],
    match: [/^\d+$/, 'El teléfono debe contener solo dígitos']
  },

  paisOrigen: { type: String, required: true },
  provincia: { type: String }, // Provincia de Ecuador (solo para usuarios ecuatorianos)

 
  role: {
    type: String,
    enum: ['ADMIN', 'USER', 'AGENTE'],
    default: 'USER'
  },

  // Rutas asignadas a un Agente de Turismo para verificar boletos (solo aplica a role AGENTE).
  assignedRutas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ruta' }],

  password: { type: String, required: true, minlength: 6 },

  createdAt: { type: Date, default: Date.now }
});


UserSchema.index({ cedula: 1 }, { unique: true, sparse: true });


UserSchema.index({ pasaporte: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);
