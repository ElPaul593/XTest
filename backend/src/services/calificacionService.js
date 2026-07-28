const CalificacionRepo = require('../repositories/calificacionRepo');
const User = require('../models/userModel');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para calificaciones.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para calificaciones.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción CalificacionRepo.
 */

exports.getAll = async (filters = {}) => {
  return CalificacionRepo.findAll(filters);
};

exports.getByTipoYReferencia = async (tipo, referencia) => {
  return CalificacionRepo.findByTipoYReferencia(tipo, referencia);
};

exports.getByUsuario = async (usuarioId) => {
  return CalificacionRepo.findByUsuario(usuarioId);
};

exports.getById = async (id) => {
  const calificacion = await CalificacionRepo.findById(id);
  if (!calificacion) throw new Error('Calificación no encontrada');
  return calificacion;
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado a crear calificaciones con validación de usuario existente.
 */
exports.create = async (data) => {
  // Verificar que el usuario existe
  const user = await User.findById(data.usuario);
  if (!user) throw new Error('Usuario no encontrado');
  
  return CalificacionRepo.create(data);
};

exports.update = async (id, data) => {
  const calificacion = await CalificacionRepo.findById(id);
  if (!calificacion) throw new Error('Calificación no encontrada');
  return CalificacionRepo.updateById(id, data);
};

exports.delete = async (id) => {
  const calificacion = await CalificacionRepo.findById(id);
  if (!calificacion) throw new Error('Calificación no encontrada');
  return CalificacionRepo.deleteById(id);
};

