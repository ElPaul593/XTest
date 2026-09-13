const HotelRepo = require('../repositories/hotelRepo');
const { getProvinciaFromCiudad } = require('../utils/provinciaUtils');
const googlePlacesService = require('./googlePlacesService');

const HOTEL_SYNC_TTL_MS = 48 * 60 * 60 * 1000;

function normalizeCiudad(ciudad) {
  return typeof ciudad === 'string' ? ciudad.trim() : '';
}

function getNewestSyncTimestamp(hoteles = []) {
  return hoteles.reduce((latest, hotel) => {
    const fecha = hotel?.fechaSincronizacion ? new Date(hotel.fechaSincronizacion) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) {
      return latest;
    }

    if (!latest || fecha.getTime() > latest.getTime()) {
      return fecha;
    }

    return latest;
  }, null);
}

function isHotelCacheFresh(hoteles = []) {
  if (!Array.isArray(hoteles) || hoteles.length === 0) {
    return false;
  }

  const newestSync = getNewestSyncTimestamp(hoteles);
  if (!newestSync) {
    return false;
  }

  return Date.now() - newestSync.getTime() < HOTEL_SYNC_TTL_MS;
}

async function persistGoogleHotels(hotelesGoogle = [], ciudad) {
  return HotelRepo.bulkUpsertGoogleHotels(hotelesGoogle, ciudad);
}

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
  const ciudadNormalizada = normalizeCiudad(ciudad);

  if (!ciudadNormalizada) {
    return [];
  }

  const hotelesMongo = await HotelRepo.findByCiudad(ciudadNormalizada);
  const debeSincronizar = !isHotelCacheFresh(hotelesMongo);

  if (!debeSincronizar) {
    return hotelesMongo;
  }

  const provincia = getProvinciaFromCiudad(ciudadNormalizada);
  const timerLabel = `[hotelService] Sincronización Google Places para ${ciudadNormalizada}`;
  console.time(timerLabel);

  const hotelesGoogle = await googlePlacesService.searchHotelsByLocation({
    ciudad: ciudadNormalizada,
    provincia
  });

  if (!Array.isArray(hotelesGoogle) || hotelesGoogle.length === 0) {
    console.timeEnd(timerLabel);
    return hotelesMongo;
  }

  try {
    await persistGoogleHotels(hotelesGoogle, ciudadNormalizada);
  } catch (error) {
    console.warn(`[hotelService] No se pudieron persistir hoteles de Google para ${ciudadNormalizada}: ${error.message}`);
    console.timeEnd(timerLabel);
    return hotelesMongo;
  }
  console.timeEnd(timerLabel);

  const hotelesActualizados = await HotelRepo.findByCiudad(ciudadNormalizada);
  return hotelesActualizados.length > 0 ? hotelesActualizados : hotelesMongo;
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

exports.getPhotoById = async (id) => {
  const hotel = await HotelRepo.findById(id);
  if (!hotel?.googlePlaceId) {
    return null;
  }

  return googlePlacesService.fetchPhotoBufferByPlaceId(hotel.googlePlaceId);
};

