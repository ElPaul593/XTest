const bcrypt = require('bcrypt');
const UserRepo = require('../repositories/userRepo');
const AuthService = require('./authService');
const Reserva = require('../models/reservaModel');
const Calificacion = require('../models/calificacionModel');
const LugaresRecomendados = require('../models/lugaresRecomendadosModel');
const Hold = require('../models/holdModel');

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
 * Elimina físicamente una cuenta solo si nunca generó registros.
 * Si existen reservas, calificaciones, recomendaciones o reservas temporales,
 * conserva el historial y bloquea la cuenta para proteger la integridad.
 */
exports.remove = async (id) => {
  const [reservas, calificaciones, recomendaciones, holds] = await Promise.all([
    Reserva.exists({ user: id }),
    Calificacion.exists({ usuario: id }),
    LugaresRecomendados.exists({ usuario: id }),
    Hold.exists({ userId: String(id) })
  ]);

  const hasHistory = Boolean(reservas || calificaciones || recomendaciones || holds);

  if (hasHistory) {
    const user = await UserRepo.markAsDeleted(
      id,
      'Cuenta bloqueada por existir historial o registros asociados'
    );

    return user ? { user, physicallyDeleted: false, blocked: true } : null;
  }

  const deleted = await UserRepo.deleteById(id);
  return deleted ? { user: deleted, physicallyDeleted: true, blocked: false } : null;
};

exports.restore = async (id) => {
  const user = await UserRepo.restore(id);
  return user ? { user, restored: true } : null;
};
