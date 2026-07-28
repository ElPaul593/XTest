const bcrypt = require('bcrypt');
const UserRepo = require('../repositories/userRepo');
const AuthService = require('./authService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Lógica de negocio para usuarios. La creación delega en AuthService.createUserAccount
 * para que exista una ÚNICA fuente de verdad (mismas validaciones que el registro).
 */

exports.getAll = async (options = {}) => UserRepo.findAll(options);
exports.getById = async (id) => UserRepo.findById(id);

/**
 * Creación administrativa de usuarios. Reutiliza exactamente las reglas del registro
 * (cédula/pasaporte, normalización, hash, provincia) y permite asignar rol.
 * Devuelve el usuario sin el campo password.
 */
exports.create = async (data) => {
  const user = await AuthService.createUserAccount({ ...data, role: data.role || 'USER' });
  const obj = user.toObject ? user.toObject() : user;
  const { password, __v, ...clean } = obj;
  return clean;
};

/**
 * Actualiza un usuario.
 * @param {object} opts
 * @param {boolean} [opts.allowRole=false] - Solo los flujos admin pueden cambiar el rol.
 *   El flujo de auto-edición (/me) NUNCA debe permitirlo (evita escalada de privilegios).
 */
exports.update = async (id, data = {}, { allowRole = false } = {}) => {
  const update = {};

  if (data.nombre !== undefined) update.nombre = String(data.nombre).trim();
  if (data.apellido !== undefined) update.apellido = String(data.apellido).trim();
  if (data.telefono !== undefined) update.telefono = String(data.telefono).replace(/\D/g, '').slice(0, 15);
  if (data.provincia !== undefined) update.provincia = String(data.provincia).trim();

  if (data.password && String(data.password).trim() !== '') {
    update.password = await bcrypt.hash(String(data.password), 10);
  }

  if (allowRole && data.role !== undefined) {
    const normalized = String(data.role).toUpperCase();
    if (['ADMIN', 'USER', 'AGENTE'].includes(normalized)) {
      update.role = normalized;
    }
  }

  // Asignación de rutas a un Agente de Turismo (solo en flujos admin).
  if (allowRole && data.assignedRutas !== undefined) {
    update.assignedRutas = Array.isArray(data.assignedRutas)
      ? data.assignedRutas.filter(Boolean)
      : [];
  }

  return UserRepo.updateById(id, update);
};

exports.remove = async (id) => UserRepo.deleteById(id);
