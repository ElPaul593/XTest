const mongoose = require('mongoose');
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

exports.bulkUpsertGoogleHotels = async (hotelesGoogle = [], ciudad) => {
  if (!Array.isArray(hotelesGoogle) || hotelesGoogle.length === 0) {
    return;
  }

  const validHoteles = hotelesGoogle.filter(
    (h) => h?.googlePlaceId && h?.nombre && h?.direccion
  );

  if (validHoteles.length === 0) {
    return;
  }

  const placeIds = validHoteles.map((h) => h.googlePlaceId);
  const existingHoteles = await Hotel.find(
    { googlePlaceId: { $in: placeIds } },
    { googlePlaceId: 1 }
  ).lean();

  const existingMap = new Map(existingHoteles.map((h) => [h.googlePlaceId, h._id]));
  const fechaSincronizacion = new Date();

  const operations = validHoteles.map((hotelGoogle) => {
    const existingId = existingMap.get(hotelGoogle.googlePlaceId);
    const id = existingId || new mongoose.Types.ObjectId();

    return {
      updateOne: {
        filter: { googlePlaceId: hotelGoogle.googlePlaceId },
        update: {
          $set: {
            nombre: hotelGoogle.nombre,
            ciudad,
            direccion: hotelGoogle.direccion,
            descripcion: hotelGoogle.descripcion || '',
            telefono: hotelGoogle.telefono || '',
            email: hotelGoogle.email || '',
            precioPromedio: hotelGoogle.precioPromedio ?? null,
            ratingGoogle: hotelGoogle.ratingGoogle ?? null,
            totalRatingsGoogle: hotelGoogle.totalRatingsGoogle ?? null,
            lat: hotelGoogle.lat ?? null,
            lng: hotelGoogle.lng ?? null,
            fechaSincronizacion,
            fotoUrl: `/hoteles/${id}/foto`
          },
          $setOnInsert: {
            _id: id
          }
        },
        upsert: true
      }
    };
  });

  return Hotel.bulkWrite(operations);
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


