const axios = require('axios');
const AppError = require('../utils/AppError');
const Ruta = require('../models/rutaModel');

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

function buildDirectionsParams(origen, destino) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    throw new AppError('GOOGLE_MAPS_SERVER_KEY no está configurada', 500);
  }

  const origin = typeof origen === 'string' ? origen.trim() : '';
  const destination = typeof destino === 'string' ? destino.trim() : '';

  if (!origin || !destination) {
    throw new AppError('Origen y destino son requeridos para consultar Google Maps', 400);
  }

  return {
    origin,
    destination,
    key: apiKey,
    language: 'es'
  };
}

async function fetchDirections(origen, destino) {
  const params = buildDirectionsParams(origen, destino);

  const response = await axios.get(GOOGLE_DIRECTIONS_URL, {
    params,
    timeout: 10000
  });

  const route = response.data?.routes?.[0];
  const leg = route?.legs?.[0];

  if (!route || !leg) {
    throw new Error('No se encontraron rutas en Google Directions');
  }

  return {
    polyline: route.overview_polyline?.points || null,
    duracionEstimada: leg.duration?.value ?? null,
    duracionTexto: leg.duration?.text || null
  };
}

async function ensureRouteMapData(ruta) {
  const rutaId = ruta?._id || ruta?.id;
  const existingPolyline = ruta?.polyline || null;
  const existingDuration = ruta?.duracionEstimada ?? null;

  if (existingPolyline && existingDuration != null) {
    return {
      ...ruta,
      polyline: existingPolyline,
      duracionEstimada: existingDuration,
      mapAvailable: true
    };
  }

  try {
    const directions = await fetchDirections(ruta.from, ruta.to);

    if (rutaId && directions.polyline && directions.duracionEstimada != null) {
      await Ruta.findByIdAndUpdate(rutaId, {
        $set: {
          polyline: directions.polyline,
          duracionEstimada: directions.duracionEstimada
        }
      });
    }

    return {
      ...ruta,
      polyline: directions.polyline,
      duracionEstimada: directions.duracionEstimada,
      mapAvailable: Boolean(directions.polyline && directions.duracionEstimada != null)
    };
  } catch (error) {
    console.warn(`[mapsService] No se pudo obtener mapa para ${ruta?.from} -> ${ruta?.to}: ${error.message}`);

    return {
      ...ruta,
      polyline: existingPolyline,
      duracionEstimada: existingDuration,
      mapAvailable: Boolean(existingPolyline && existingDuration != null),
      mapError: 'No hay datos de mapa disponibles'
    };
  }
}

module.exports = {
  fetchDirections,
  ensureRouteMapData
};