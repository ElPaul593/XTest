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

  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => {
        if (value == null || value === '') return true;
        const text = String(value);
        const atIndex = text.indexOf('@');
        const lastDotIndex = text.lastIndexOf('.');
        if (!(atIndex > 0 && lastDotIndex > atIndex + 1 && lastDotIndex < text.length - 1)) {
          return false;
        }

        for (const char of text) {
          if (char.trim() === '') {
            return false;
          }
        }

        return true;
      },
      message: 'Email inválido'
    }
  },

  telefono: { 
    type: String, 
    required: true, 
    minlength: [10, 'El teléfono necesita 10 dígitos'], 
    maxlength: [15, 'El teléfono no puede tener más de 15 dígitos'],
    match: [/^\d+$/, 'El teléfono debe contener solo dígitos']
  },

  paisOrigen: { type: String, required: true },
  provincia: { type: String }, // Provincia de Ecuador (solo para usuarios ecuatorianos)
  preferencias: {
    type: [String],
    enum: ['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro'],
    default: []
  },


  role: {
    type: String,
    enum: ['ADMIN', 'USER', 'AGENTE'],
    default: 'USER'
  },

  /**
   * Ciclo de vida de la cuenta (baja lógica, no física).
   *
   * ACTIVO    — cuenta operativa.
   * BLOQUEADO — bloqueo administrativo temporal: el usuario no puede iniciar sesión
   *             ni usar un token ya emitido, pero su historial (reservas, boletos,
   *             calificaciones) se conserva íntegro y puede reactivarse.
   * ELIMINADO — el usuario pidió la baja. Para el usuario la cuenta "ya no existe",
   *             pero en la BD sigue presente para no romper las referencias de
   *             reservas/boletos/calificaciones (datos retrospectivos de la tesis).
   *
   * Los documentos creados antes de esta migración no tienen el campo; todo el
   * código debe tratar `undefined` como ACTIVO (ver utils/estadoCuenta.js).
   */
  estado: {
    type: String,
    enum: ['ACTIVO', 'BLOQUEADO', 'ELIMINADO'],
    default: 'ACTIVO'
  },

  // Metadatos de la baja/bloqueo: quién, cuándo y por qué. Sirven para auditoría
  // y para mostrarle al usuario el motivo exacto cuando intenta entrar.
  estadoMotivo: { type: String, default: null },
  estadoCambiadoEn: { type: Date, default: null },
  estadoCambiadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Rutas asignadas a un Agente de Turismo para verificar boletos (solo aplica a role AGENTE).
  assignedRutas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ruta' }],

  password: { type: String, required: true, minlength: 6 },

  /**
   * Identificador de Google (claim `sub` del id_token).
   *
   * Es estable y único por cuenta de Google, a diferencia del correo, que el
   * usuario puede cambiar. Se guarda al vincular para poder reconocer la cuenta
   * aunque el correo cambie después.
   *
   * OJO con la unicidad: NO lleva `default: null` a propósito.
   *
   * `sparse: true` omite del índice los documentos donde el campo está AUSENTE,
   * pero no los que lo tienen con valor `null`. Con `default: null`, todo usuario
   * que no usara Google quedaba indexado con la misma clave y el segundo registro
   * fallaba con:
   *
   *   E11000 duplicate key error ... index: googleId_1 dup key: { googleId: null }
   *
   * Es decir: habría impedido registrar a nadie más a partir del segundo usuario.
   * Sin `default`, el campo sencillamente no existe hasta que se vincula Google,
   * que es lo que `sparse` necesita. El índice se declara abajo con
   * `partialFilterExpression` para dejar la intención explícita.
   */
  googleId: { type: String },

  // Foto de perfil de Google. Solo informativa.
  googleAvatar: { type: String, default: null },

  /**
   * Recuperación de contraseña.
   * Guardamos el HASH del token (SHA-256), nunca el token en claro: si alguien
   * lee la colección no puede reconstruir el enlace de reseteo.
   */
  resetPasswordTokenHash: { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date, default: null, select: false },

  createdAt: { type: Date, default: Date.now }
});


/*
 * #35BUG — CORREGIDO: se eliminaron tres `schema.index()` duplicados.
 *
 * `cedula`, `pasaporte` y `email` ya declaran `unique: true` y `sparse: true` en
 * su definición de campo (arriba), lo que basta para que Mongoose cree el índice.
 * Volver a declararlo con `schema.index()` provocaba este aviso en cada arranque
 * y en cada ejecución de los tests:
 *
 *   [MONGOOSE] Warning: mongoose: Duplicate schema index on {"email":1} for
 *   model "User".
 *
 * No corrompía datos, pero ensuciaba la salida tapando mensajes útiles y dejaba la
 * definición de los índices en dos sitios, de modo que cambiar uno sin el otro
 * producía un desajuste silencioso.
 *
 * Los dos índices de abajo SÍ hacen falta: `estado` y `resetPasswordTokenHash` no
 * declaran `unique` ni `index` en su campo.
 */

// Listados administrativos filtrados por estado de cuenta.
UserSchema.index({ estado: 1 });

// Búsqueda del token de reseteo (solo entradas vigentes).
UserSchema.index({ resetPasswordTokenHash: 1 }, { sparse: true });

/**
 * Unicidad de la cuenta de Google.
 *
 * Se usa `partialFilterExpression` en lugar de `sparse` porque es explícito y
 * cubre también el caso de un `googleId: null` escrito a mano: el índice solo
 * incluye documentos cuyo `googleId` sea una cadena, así que los usuarios que no
 * usan Google quedan fuera y no compiten por la misma clave.
 */
UserSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
);

module.exports = mongoose.model('User', UserSchema);
