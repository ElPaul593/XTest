const bcrypt = require('bcrypt');
const UserRepo = require('../repositories/userRepo');
const AuthService = require('./authService');
const AppError = require('../utils/AppError');
const { ESTADOS, getEstado } = require('../utils/estadoCuenta');

const PREFERENCIAS_VALIDAS = new Set(['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro']);

function normalizePreferencias(preferencias) {
  if (!Array.isArray(preferencias)) {
    return [];
  }

  return [...new Set(preferencias.map((preferencia) => String(preferencia).trim()).filter((preferencia) => PREFERENCIAS_VALIDAS.has(preferencia)))];
}

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Lógica de negocio para usuarios. La creación delega en AuthService.createUserAccount
 * para que exista una ÚNICA fuente de verdad (mismas validaciones que el registro).
 */

exports.getAll = async (options = {}) => UserRepo.findAll(options);
exports.getById = async (id) => UserRepo.findById(id);
exports.contarPorEstado = async () => UserRepo.countByEstado();

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

  if (data.email !== undefined) update.email = String(data.email).trim().toLowerCase();
  if (data.nombre !== undefined) update.nombre = String(data.nombre).trim();
  if (data.apellido !== undefined) update.apellido = String(data.apellido).trim();
  if (data.telefono !== undefined) update.telefono = String(data.telefono).replace(/\D/g, '').slice(0, 15);
  if (data.provincia !== undefined) update.provincia = String(data.provincia).trim();

  if (data.password && String(data.password).trim() !== '') {
    update.password = await bcrypt.hash(String(data.password), 10);
  }

  if (data.preferencias !== undefined) update.preferencias = normalizePreferencias(data.preferencias);

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

/**
 * Baja de cuenta (la pide el propio usuario desde su perfil).
 *
 * No borra nada: marca la cuenta como ELIMINADO. Desde fuera la cuenta deja de
 * existir (no puede iniciar sesión y su token deja de servir), pero el documento
 * permanece para que las reservas, boletos y calificaciones conserven a quién
 * pertenecieron. Es la diferencia entre "dar de baja" y "perder los datos".
 */
exports.softDelete = async (id, { motivo = null, actorId = null } = {}) => {
  const user = await UserRepo.findById(id);
  if (!user) return null;

  if (getEstado(user) === ESTADOS.ELIMINADO) {
    throw new AppError('Esta cuenta ya estaba dada de baja', 409);
  }

  return UserRepo.updateEstadoById(id, {
    estado: ESTADOS.ELIMINADO,
    motivo: motivo || 'Baja solicitada por el titular de la cuenta',
    actorId
  });
};

/**
 * Eliminación solicitada desde el panel administrativo.
 * Una cuenta con actividad se bloquea para conservar su historial; una cuenta
 * nueva, sin referencias en colecciones históricas, sí puede eliminarse.
 */
exports.removeFromAdmin = async (id, { actorId = null } = {}) => {
  const user = await UserRepo.findById(id);
  if (!user) return null;

  if (actorId && String(actorId) === String(id)) {
    throw new AppError('No puedes eliminar tu propia cuenta de administrador', 400);
  }

  if (getEstado(user) === ESTADOS.ELIMINADO) {
    throw new AppError('Esta cuenta ya fue dada de baja', 409);
  }

  const result = await UserRepo.removeIfWithoutHistory(id);
  if (result.deleted) {
    return { deleted: true, blocked: false };
  }

  const blocked = await UserRepo.updateEstadoById(id, {
    estado: ESTADOS.BLOQUEADO,
    motivo: 'Cuenta protegida: conserva reservas o historial en la plataforma',
    actorId
  });

  return { deleted: false, blocked: true, data: blocked };
};

/**
 * Cambio administrativo del estado de una cuenta (bloquear / reactivar / dar de baja).
 *
 * @param {string} id
 * @param {'ACTIVO'|'BLOQUEADO'|'ELIMINADO'} estado
 * @param {object} opts
 * @param {string} [opts.motivo]  - Se le muestra al usuario al intentar entrar.
 * @param {string} [opts.actorId] - Admin que ejecuta el cambio (auditoría).
 */
exports.cambiarEstado = async (id, estado, { motivo = null, actorId = null } = {}) => {
  const estadoNormalizado = String(estado || '').toUpperCase();

  if (!Object.values(ESTADOS).includes(estadoNormalizado)) {
    throw new AppError(`Estado no válido. Valores permitidos: ${Object.values(ESTADOS).join(', ')}`, 400);
  }

  const user = await UserRepo.findById(id);
  if (!user) return null;

  // Un administrador no puede bloquearse ni darse de baja a sí mismo: dejaría el
  // panel sin acceso y haría falta intervenir la base de datos a mano.
  if (actorId && String(actorId) === String(id) && estadoNormalizado !== ESTADOS.ACTIVO) {
    throw new AppError('No puedes bloquear ni dar de baja tu propia cuenta de administrador', 400);
  }

  if (getEstado(user) === estadoNormalizado) {
    throw new AppError(`La cuenta ya está en estado ${estadoNormalizado}`, 409);
  }

  return UserRepo.updateEstadoById(id, {
    estado: estadoNormalizado,
    // Al reactivar se limpia el motivo anterior: ya no describe la situación actual.
    motivo: estadoNormalizado === ESTADOS.ACTIVO ? null : motivo,
    actorId
  });
};
