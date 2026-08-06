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
  const ciudadNormalizada = ciudad ? ciudad.trim() : '';

  if (!ciudadNormalizada) {
    return [];
  }

  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return Hotel.find({
    ciudad: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).sort({ createdAt: -1 }).lean();
};

exports.findByGooglePlaceId = async (googlePlaceId) => {
  if (!googlePlaceId) {
    return null;
  }

  return Hotel.findOne({ googlePlaceId }).lean();
};

exports.findById = async (id) => {
  return Hotel.findById(id).lean();
};

exports.create = async (data) => {
  const hotel = new Hotel(data);
  return hotel.save();
};

exports.upsertByGooglePlaceId = async (googlePlaceId, data) => {
  if (!googlePlaceId) {
    throw new Error('googlePlaceId es requerido para el upsert');
  }

  return Hotel.findOneAndUpdate(
    { googlePlaceId },
    {
      $set: {
        ...data,
        googlePlaceId
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  ).lean();
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

