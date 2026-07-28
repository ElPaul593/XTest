const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { validarCedulaEcuatoriana } = require('../utils/cedulaValidator');
const { getProvinciaFromCedula } = require('../utils/provinciaUtils');

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
  return /^[0-9]{1,10}$/.test(cedula);
}

/**
 * Crea una cuenta de usuario aplicando todas las reglas de negocio
 * (validación de cédula/pasaporte, normalización, hash y detección de provincia).
 * Es la ÚNICA puerta de creación de usuarios para evitar caminos divergentes.
 *
 * @param {object} data
 * @param {string} [data.role] - 'USER' por defecto; 'ADMIN' solo si el llamador lo permite.
 */
exports.createUserAccount = async ({ cedula, pasaporte, nombre, apellido, telefono, password, paisOrigen, provincia, role = 'USER' }) => {
  if (!nombre || !apellido || !telefono || !password) {
    throw new AppError('Todos los campos son requeridos', 400);
  }

  const telefonoLimpio = String(telefono).replace(/\D/g, '').slice(0, 15);
  if (telefonoLimpio.length < 10) {
    throw new AppError('El teléfono debe tener al menos 10 dígitos', 400);
  }

  const normalizedRole = String(role || 'USER').toUpperCase();
  const assignedRole = ['ADMIN', 'AGENTE', 'USER'].includes(normalizedRole) ? normalizedRole : 'USER';
  const paisSeleccionado = paisOrigen ? String(paisOrigen).trim() : '';

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

    const existing = await User.findOne({ cedula: cedulaLimpia });
    if (existing) throw new AppError('Usuario con esa cédula ya existe', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      cedula: cedulaLimpia,
      nombre,
      apellido,
      telefono: telefonoLimpio,
      password: hashed,
      paisOrigen: paisSeleccionado || 'Ecuador',
      provincia: provincia || getProvinciaFromCedula(cedulaLimpia),
      role: assignedRole
    });
    return user.save();
  }

  // Camino extranjero: usa pasaporte
  if (!pasaporte) throw new AppError('El pasaporte es requerido para usuarios extranjeros', 400);
  if (!paisSeleccionado) throw new AppError('El país de origen es requerido', 400);

  const pasaporteLimpio = String(pasaporte).trim();
  if (pasaporteLimpio.length < 6 || pasaporteLimpio.length > 20) {
    throw new AppError('El pasaporte debe tener entre 6 y 20 caracteres', 400);
  }

  const existing = await User.findOne({ pasaporte: pasaporteLimpio });
  if (existing) throw new AppError('Usuario con ese pasaporte ya existe', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    pasaporte: pasaporteLimpio,
    nombre,
    apellido,
    telefono: telefonoLimpio,
    password: hashed,
    paisOrigen: paisSeleccionado,
    role: assignedRole
  });
  return user.save();
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
