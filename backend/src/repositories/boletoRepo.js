const Boleto = require('../models/boletoModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de boletos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: operaciones CRUD para boletos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Boleto.
 */

exports.findAll = async () => Boleto.find().lean();
exports.create = async (data) => {
  const b = new Boleto(data);
  return b.save();
};
