const ReservaRepo = require('../repositories/reservaRepo');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para reservas.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para reservas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción ReservaRepo.
 */

exports.getAll = async (options = {}) => {
  return ReservaRepo.findAll(options);
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado a crear reservas con validaciones de negocio.
 * La lógica de validación de disponibilidad estaría aquí.
 */
exports.create = async (data) => {
  // Business logic to validate availability, associate route and generate boleto would go here
  return ReservaRepo.create(data);
};

exports.cancel = async (id) => {
  return ReservaRepo.cancel(id);
};
