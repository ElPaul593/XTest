const HotelRepo = require('../repositories/hotelRepo');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para hoteles.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para hoteles.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción HotelRepo.
 */

exports.getAll = async (filters = {}) => {
  return HotelRepo.findAll(filters);
};

exports.getByCiudad = async (ciudad) => {
  return HotelRepo.findByCiudad(ciudad);
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado a obtener un hotel por ID con validación de existencia.
 */
exports.getById = async (id) => {
  const hotel = await HotelRepo.findById(id);
  if (!hotel) throw new Error('Hotel no encontrado');
  return hotel;
};

exports.create = async (data) => {
  return HotelRepo.create(data);
};

exports.update = async (id, data) => {
  const hotel = await HotelRepo.findById(id);
  if (!hotel) throw new Error('Hotel no encontrado');
  return HotelRepo.updateById(id, data);
};

exports.delete = async (id) => {
  const hotel = await HotelRepo.findById(id);
  if (!hotel) throw new Error('Hotel no encontrado');
  return HotelRepo.deleteById(id);
};

