const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const crypto = require('crypto');
const AccountRecovery = require('../models/accountRecoveryModel');
const RecoveryEmailService = require('./accountRecoveryEmailService');
const AppError = require('../utils/AppError');
const { validarCedulaEcuatoriana } = require('../utils/cedulaValidator');
const { getProvinciaFromCedula } = require('../utils/provinciaUtils');

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
  if (user.isDeleted) {
    throw new AppError('Las credenciales no son válidas o la cuenta no está disponible.\nSi necesitas recuperar el acceso, usa “Recuperar cuenta”.', 403);
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError('Usuario o contraseña inválidos', 401);

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

const GENERIC_RECOVERY_MESSAGE = 'Si los datos coinciden con una cuenta recuperable, recibirás instrucciones en el correo registrado.';
const RECOVERY_TTL_MS = 10 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

exports.requestRecovery = async ({ cedula, pasaporte, email, purpose = 'account' }) => {
  const identifier = cedula
    ? { cedula: String(cedula).replace(/\D/g, '') }
    : { pasaporte: String(pasaporte).trim() };
  const user = await User.findOne({
    ...identifier,
    email: String(email).trim().toLowerCase(),
    isDeleted: purpose === 'account'
  });

  if (!user) return { message: GENERIC_RECOVERY_MESSAGE };

  await AccountRecovery.updateMany(
    { user: user._id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } }
  );

  const code = String(crypto.randomInt(100000, 1000000));
  const recovery = await AccountRecovery.create({
    user: user._id,
    codeHash: hashRecoveryCode(code),
    purpose,
    expiresAt: new Date(Date.now() + RECOVERY_TTL_MS)
  });

  await RecoveryEmailService.sendCode(user.email, code);
  return { message: GENERIC_RECOVERY_MESSAGE, recoveryId: recovery._id.toString() };
};

exports.confirmRecovery = async ({ recoveryId, code, password }) => {
  const recovery = await AccountRecovery.findOne({
    _id: recoveryId,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!recovery || recovery.attempts >= MAX_RECOVERY_ATTEMPTS) {
    throw new AppError('Código inválido o expirado', 400);
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(recovery.codeHash),
    Buffer.from(hashRecoveryCode(code))
  );

  if (!valid) {
    recovery.attempts += 1;
    await recovery.save();
    throw new AppError('Código inválido o expirado', 400);
  }

  const isAccountRecovery = recovery.purpose !== 'password';
  const user = await User.findOneAndUpdate(
    { _id: recovery.user, isDeleted: isAccountRecovery },
    isAccountRecovery
      ? {
          $set: { password: await bcrypt.hash(password, 10), isDeleted: false },
          $unset: { deletedAt: 1, deletionReason: 1 }
        }
      : { $set: { password: await bcrypt.hash(password, 10) } },
    { new: true }
  );

  if (!user) throw new AppError('Código inválido o expirado', 400);

  recovery.usedAt = new Date();
  await recovery.save();
  return { message: 'Cuenta recuperada exitosamente' };
};
