const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { validarCedulaEcuatoriana } = require('../utils/cedulaValidator');
const { getProvinciaFromCedula } = require('../utils/provinciaUtils');
const { assertCuentaOperativa, getEstado, ESTADOS } = require('../utils/estadoCuenta');
const { buildResetPasswordUrl } = require('../config/appUrls');
const MailerService = require('./mailerService');
const GoogleAuthService = require('./googleAuthService');

const PREFERENCIAS_VALIDAS = new Set(['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro']);

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio especializado en autenticación, registro y emisión de tokens.
 * La creación de usuarios queda centralizada en createUserAccount, usada tanto
 * por el registro público como por la creación administrativa de usuarios.
 * Los errores se lanzan como AppError (operacionales) para que el errorHandler
 * responda con el status y mensaje correctos (en vez de un 500 genérico).
 */

const SALT_ROUNDS = 10;

// Ventana de validez del enlace de recuperación de contraseña.
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

/**
 * El token viaja en claro en el enlace del correo, pero en la BD solo se guarda
 * su hash. Así, leer la colección no basta para secuestrar un reseteo en curso.
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function validateCedula(cedula) {
  return /^\d{1,10}$/.test(cedula);
}

function normalizePreferencias(preferencias) {
  if (!Array.isArray(preferencias)) {
    return [];
  }

  return [...new Set(preferencias.map((preferencia) => String(preferencia).trim()).filter((preferencia) => PREFERENCIAS_VALIDAS.has(preferencia)))];
}

async function createNationalUser({ cedulaLimpia, nombre, apellido, telefonoLimpio, emailLimpio, password, paisSeleccionado, provincia, preferenciasLimpias, assignedRole }) {
  const existing = await User.findOne({ cedula: cedulaLimpia });
  if (existing) throw new AppError('Usuario con esa cédula ya existe', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    cedula: cedulaLimpia,
    nombre,
    apellido,
    telefono: telefonoLimpio,
    email: emailLimpio,
    password: hashed,
    paisOrigen: paisSeleccionado || 'Ecuador',
    provincia: provincia || getProvinciaFromCedula(cedulaLimpia),
    preferencias: preferenciasLimpias,
    role: assignedRole
  });
  return user.save();
}

async function createForeignUser({ pasaporteLimpio, nombre, apellido, telefonoLimpio, emailLimpio, password, paisSeleccionado, preferenciasLimpias, assignedRole }) {
  const existing = await User.findOne({ pasaporte: pasaporteLimpio });
  if (existing) throw new AppError('Usuario con ese pasaporte ya existe', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    pasaporte: pasaporteLimpio,
    nombre,
    apellido,
    telefono: telefonoLimpio,
    email: emailLimpio,
    password: hashed,
    paisOrigen: paisSeleccionado,
    preferencias: preferenciasLimpias,
    role: assignedRole
  });
  return user.save();
}

/**
 * Crea una cuenta de usuario aplicando todas las reglas de negocio
 * (validación de cédula/pasaporte, normalización, hash y detección de provincia).
 * Es la ÚNICA puerta de creación de usuarios para evitar caminos divergentes.
 *
 * @param {object} data
 * @param {string} [data.role] - 'USER' por defecto; 'ADMIN' solo si el llamador lo permite.
 */
exports.createUserAccount = async ({ cedula, pasaporte, email, nombre, apellido, telefono, password, paisOrigen, provincia, preferencias = [], role = 'USER' }) => {
  if (!nombre || !apellido || !telefono || !password || !email) {
    throw new AppError('Todos los campos son requeridos', 400);
  }

  const emailLimpio = String(email).trim().toLowerCase();
  const existingEmail = await User.findOne({ email: emailLimpio });
  if (existingEmail) {
    throw new AppError('Usuario con ese correo ya existe', 409);
  }

  const telefonoLimpio = String(telefono).replace(/\D/g, '').slice(0, 15);
  if (telefonoLimpio.length < 10) {
    throw new AppError('El teléfono debe tener al menos 10 dígitos', 400);
  }

  const preferenciasLimpias = normalizePreferencias(preferencias);

  const normalizedRole = String(role || 'USER').toUpperCase();
  const assignedRole = ['ADMIN', 'AGENTE', 'USER'].includes(normalizedRole) ? normalizedRole : 'USER';
  const paisSeleccionado = paisOrigen ? String(paisOrigen).trim() : '';
  const pasaporteLimpio = pasaporte ? String(pasaporte).trim() : '';

  // Camino nacional: usa cédula ecuatoriana
  if (cedula || paisSeleccionado === 'Ecuador') {
    if (!cedula) throw new AppError('La cédula es requerida para usuarios nacionales', 400);
    if (!validateCedula(cedula)) throw new AppError('Cédula debe contener hasta 10 dígitos numéricos', 400);

    const cedulaLimpia = String(cedula).replace(/\D/g, '').slice(0, 10);
    if (cedulaLimpia.length !== 10) {
      throw new AppError('La cédula ecuatoriana debe tener exactamente 10 dígitos', 400);
    }
    if (!validarCedulaEcuatoriana(cedulaLimpia)) {
      throw new AppError('La cédula ecuatoriana no es válida.', 400);
    }

    return createNationalUser({
      cedulaLimpia,
      nombre,
      apellido,
      telefonoLimpio,
      emailLimpio,
      password,
      paisSeleccionado,
      provincia,
      preferenciasLimpias,
      assignedRole
    });
  }

  // Camino extranjero: usa pasaporte
  if (!pasaporte) throw new AppError('El pasaporte es requerido para usuarios extranjeros', 400);
  if (!paisSeleccionado) throw new AppError('El país de origen es requerido', 400);

  if (pasaporteLimpio.length < 6 || pasaporteLimpio.length > 20) {
    throw new AppError('El pasaporte debe tener entre 6 y 20 caracteres', 400);
  }

  return createForeignUser({
    pasaporteLimpio,
    nombre,
    apellido,
    telefonoLimpio,
    emailLimpio,
    password,
    paisSeleccionado,
    preferenciasLimpias,
    assignedRole
  });
};

/**
 * Registro público: SIEMPRE crea con rol USER (no permite escalada de privilegios).
 */
exports.register = async (data) => {
  return exports.createUserAccount({ ...data, role: 'USER' });
};

/**
 * Login: valida credenciales y emite el JWT.
 */
exports.login = async ({ cedula, pasaporte, password }) => {
  if (!password) throw new AppError('Contraseña es requerida', 400);
  if (!cedula && !pasaporte) throw new AppError('Cédula o pasaporte es requerido', 400);

  let user;
  if (cedula) {
    const cedulaLimpia = String(cedula).replace(/\D/g, '');
    user = await User.findOne({ cedula: cedulaLimpia });
  } else {
    const pasaporteLimpio = String(pasaporte).trim();
    user = await User.findOne({ pasaporte: pasaporteLimpio });
  }
  if (!user) throw new AppError('Usuario o contraseña inválidos', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError('Usuario o contraseña inválidos', 401);

  // El estado se comprueba DESPUÉS de validar la contraseña a propósito: si se
  // comprobara antes, cualquiera podría averiguar si una cédula corresponde a una
  // cuenta bloqueada o dada de baja sin conocer las credenciales.
  assertCuentaOperativa(user);

  const roleNormalized = String(user.role || 'user').toLowerCase();
  const payload = {
    id: user._id,
    role: roleNormalized,
    cedula: user.cedula || null,
    pasaporte: user.pasaporte || null
  };

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurado en el servidor', 500);
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return { token, role: roleNormalized };
};

/**
 * Paso 1 del reseteo: el usuario pide el enlace indicando su correo.
 *
 * Responde siempre lo mismo haya o no una cuenta con ese correo. Si distinguiera
 * ambos casos, el endpoint se convertiría en un oráculo para enumerar los correos
 * registrados en el sistema.
 *
 * El correo NO se envía por SMTP desde aquí: se delega en la API consumidora
 * (ver services/mailerService.js).
 */
exports.requestPasswordReset = async ({ email }) => {
  const respuestaNeutra = {
    ok: true,
    message: 'Si el correo corresponde a una cuenta registrada, recibirás un enlace para restablecer tu contraseña.'
  };

  if (!email) {
    throw new AppError('El correo es requerido', 400);
  }

  const emailLimpio = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: emailLimpio });

  if (!user) {
    return respuestaNeutra;
  }

  // Una cuenta bloqueada o dada de baja no puede recuperar su acceso por sí sola:
  // reactivarla es una decisión administrativa, no un cambio de contraseña.
  if (getEstado(user) !== ESTADOS.ACTIVO) {
    console.warn(`[authService] Reseteo solicitado para una cuenta en estado ${getEstado(user)}: ${emailLimpio}`);
    return respuestaNeutra;
  }

  // Token en claro para el enlace; en la BD solo queda su hash.
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashResetToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  // Enlace dinámico construido con el token recién generado.
  const resetUrl = buildResetPasswordUrl(rawToken);

  const { subject, html, text } = MailerService.construirCorreoResetPassword({
    nombre: user.nombre,
    resetUrl,
    minutosValidez: RESET_TOKEN_TTL_MINUTES
  });

  const envio = await MailerService.enviarCorreo({
    to: user.email,
    subject,
    html,
    text,
    meta: { tipo: 'reset-password', usuarioId: String(user._id) }
  });

  if (!envio.ok) {
    // Si el correo no salió, el token guardado no le sirve a nadie: se limpia
    // para que un reintento genere uno nuevo en lugar de dejar basura vigente.
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    throw new AppError(
      'No se pudo enviar el correo de recuperación en este momento. Inténtalo de nuevo en unos minutos.',
      502
    );
  }

  return respuestaNeutra;
};

/**
 * Busca el usuario dueño de un token de reseteo vigente.
 * @returns {Promise<object|null>} documento Mongoose, o null si no existe o caducó.
 */
async function findUserByResetToken(token) {
  if (!token) return null;

  return User.findOne({
    resetPasswordTokenHash: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordTokenHash +resetPasswordExpires');
}

/**
 * Comprueba si un token de reseteo sigue siendo válido, sin consumirlo.
 * Lo usa el backend antes de mostrar el formulario de nueva contraseña.
 */
exports.validateResetToken = async (token) => {
  const user = await findUserByResetToken(token);
  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    nombre: user.nombre,
    email: user.email,
    expiresAt: user.resetPasswordExpires
  };
};

/**
 * Paso 2 del reseteo: el usuario envía la nueva contraseña junto con el token.
 * El token se invalida al usarse (un enlace, un solo cambio).
 */
exports.resetPassword = async ({ token, password }) => {
  if (!token) throw new AppError('El token de recuperación es requerido', 400);
  if (!password || String(password).length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    throw new AppError('El enlace de recuperación no es válido o ya caducó. Solicita uno nuevo.', 400);
  }

  // El estado pudo cambiar entre la solicitud y el uso del enlace.
  assertCuentaOperativa(user);

  const mismaPassword = await bcrypt.compare(String(password), user.password);
  if (mismaPassword) {
    throw new AppError('La nueva contraseña debe ser distinta de la actual', 400);
  }

  user.password = await bcrypt.hash(String(password), SALT_ROUNDS);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { ok: true, message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
};

exports.RESET_TOKEN_TTL_MINUTES = RESET_TOKEN_TTL_MINUTES;

/**
 * Emite el JWT de sesión para un usuario ya autenticado por cualquier vía.
 * Extraído de `login` para que el acceso con Google produzca exactamente el
 * mismo token y no haya dos formas distintas de representar una sesión.
 */
function emitirToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurado en el servidor', 500);
  }

  const roleNormalized = String(user.role || 'user').toLowerCase();

  const token = jwt.sign(
    {
      id: user._id,
      role: roleNormalized,
      cedula: user.cedula || null,
      pasaporte: user.pasaporte || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, role: roleNormalized };
}

/**
 * Inicio de sesión con Google.
 *
 * ## El problema de diseño que resuelve
 *
 * El modelo `User` exige cédula O pasaporte, y Google no entrega ninguno de los
 * dos. Validar la cédula ecuatoriana es una regla central del sistema, así que no
 * se relaja: en su lugar el flujo se parte en dos casos.
 *
 *   a) Ya existe una cuenta con ese correo  → se vincula el `googleId` y se
 *      inicia sesión. El usuario no tiene que volver a escribir su cédula.
 *
 *   b) No existe ninguna cuenta con ese correo → NO se crea nada a medias.
 *      Se devuelve `requiereRegistro: true` junto con el perfil verificado, para
 *      que el frontend muestre el registro con nombre y correo ya rellenados y
 *      solo pida lo que Google no puede dar: cédula o pasaporte, teléfono y país.
 *
 * Crear el usuario en el caso (b) con una cédula inventada habría metido datos
 * inválidos en la base y roto la validación en la que se apoya todo el registro.
 *
 * @returns {Promise<{token,role}|{requiereRegistro:true,perfil:object}>}
 */
exports.loginConGoogle = async ({ credential }) => {
  const perfil = await GoogleAuthService.verificarIdToken(credential);

  // Se busca primero por googleId (estable aunque cambie el correo) y después
  // por correo, que es lo que permite vincular una cuenta ya existente.
  let user = await User.findOne({ googleId: perfil.googleId });

  if (!user) {
    user = await User.findOne({ email: perfil.email });
  }

  if (!user) {
    return {
      requiereRegistro: true,
      perfil: {
        email: perfil.email,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        avatar: perfil.avatar
      },
      message: 'No hay ninguna cuenta con ese correo. Completa el registro para crearla.'
    };
  }

  // Estado de la cuenta: un bloqueo debe impedir también la entrada por Google.
  // Sin esta comprobación, Google sería una puerta trasera al bloqueo.
  assertCuentaOperativa(user);

  // Vinculación en el primer acceso, y actualización del avatar.
  const cambios = {};
  if (!user.googleId) cambios.googleId = perfil.googleId;
  if (perfil.avatar && user.googleAvatar !== perfil.avatar) cambios.googleAvatar = perfil.avatar;

  if (Object.keys(cambios).length > 0) {
    // `updateOne` en vez de `save()` para no disparar la validación del documento
    // completo: los usuarios antiguos podrían no cumplir reglas añadidas después,
    // y eso no debe impedirles entrar.
    await User.updateOne({ _id: user._id }, { $set: cambios });
  }

  return emitirToken(user);
};
