const Hotel = require('../models/hotelModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de hoteles.
 * Proporciona métodos especializados de búsqueda (por ciudad).
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de hoteles.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Hotel.
 */

exports.findAll = async (filters = {}) => {
  return Hotel.find(filters).sort({ createdAt: -1 }).lean();
};

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la búsqueda de hoteles por ciudad.
 */
exports.findByCiudad = async (ciudad) => {
  return Hotel.find({ ciudad }).sort({ createdAt: -1 }).lean();
};

exports.findById = async (id) => {
  return Hotel.findById(id).lean();
};

exports.create = async (data) => {
  const hotel = new Hotel(data);
  return hotel.save();
};

exports.updateById = async (id, data) => {
  return Hotel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
};

exports.deleteById = async (id) => {
  return Hotel.findByIdAndDelete(id).lean();
};

