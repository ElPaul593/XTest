const axios = require('axios');
const AppError = require('../utils/AppError');
const Ruta = require('../models/rutaModel');

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const MAP_NO_DISPONIBLE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function buildDirectionsParams(origen, destino) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    throw new AppError('GOOGLE_MAPS_SERVER_KEY no está configurada', 500);
  }

  const origin = typeof origen === 'string' ? `${origen.trim()}, Ecuador` : '';
  const destination = typeof destino === 'string' ? `${destino.trim()}, Ecuador` : '';

  if (!origin || !destination) {
    throw new AppError('Origen y destino son requeridos para consultar Google Maps', 400);
  }

  return {
    origin,
    destination,
    key: apiKey,
    language: 'es',
    region: 'ec'
  };
}

async function fetchDirections(origen, destino) {
  const params = buildDirectionsParams(origen, destino);

  const response = await axios.get(GOOGLE_DIRECTIONS_URL, {
    params,
    timeout: 10000
  });

  const status = response.data?.status;

  if (status === 'ZERO_RESULTS') {
    const error = new Error('No existe ruta en auto entre estos puntos');
    error.directionsStatus = status;
    throw error;
  }

  if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED') {
    const error = new Error('Cuota o permisos de Google Directions agotados/inválidos');
    error.directionsStatus = status;
    throw error;
  }

  if (status && status !== 'OK') {
    const error = new Error(`Google Directions respondió con estado inesperado: ${status}`);
    error.directionsStatus = status;
    throw error;
  }

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
  const mapNoDisponible = Boolean(ruta?.mapNoDisponible);
  const mapNoDisponibleAt = ruta?.mapNoDisponibleAt ? new Date(ruta.mapNoDisponibleAt) : null;
  const mapNoDisponibleVigente = mapNoDisponible
    && mapNoDisponibleAt instanceof Date
    && !Number.isNaN(mapNoDisponibleAt.getTime())
    && (Date.now() - mapNoDisponibleAt.getTime()) < MAP_NO_DISPONIBLE_TTL_MS;

  if (existingPolyline && existingDuration != null) {
    return {
      ...ruta,
      polyline: existingPolyline,
      duracionEstimada: existingDuration,
      mapAvailable: true,
      mapNoDisponible: false,
      mapNoDisponibleAt: null
    };
  }

  if (mapNoDisponibleVigente) {
    return {
      ...ruta,
      polyline: existingPolyline,
      duracionEstimada: existingDuration,
      mapAvailable: false,
      mapNoDisponible: true,
      mapNoDisponibleAt: mapNoDisponibleAt.toISOString()
    };
  }

  try {
    const directions = await fetchDirections(ruta.from, ruta.to);

    if (rutaId && directions.polyline && directions.duracionEstimada != null) {
      await Ruta.findByIdAndUpdate(rutaId, {
        $set: {
          polyline: directions.polyline,
          duracionEstimada: directions.duracionEstimada,
          mapNoDisponible: false,
          mapNoDisponibleAt: null
        }
      });
    }

    return {
      ...ruta,
      polyline: directions.polyline,
      duracionEstimada: directions.duracionEstimada,
      mapAvailable: Boolean(directions.polyline && directions.duracionEstimada != null),
      mapNoDisponible: false,
      mapNoDisponibleAt: null
    };
  } catch (error) {
    const isZeroResults = error?.directionsStatus === 'ZERO_RESULTS' || error?.message === 'No existe ruta en auto entre estos puntos';
    const isQuotaOrPermissions = error?.directionsStatus === 'OVER_QUERY_LIMIT' || error?.directionsStatus === 'REQUEST_DENIED';

    console.warn(`[mapsService] No se pudo obtener mapa para ${ruta?.from} -> ${ruta?.to}: ${error.message}`);

    if (rutaId && isZeroResults) {
      await Ruta.findByIdAndUpdate(rutaId, {
        $set: {
          mapNoDisponible: true,
          mapNoDisponibleAt: new Date()
        }
      });
    }

    return {
      ...ruta,
      polyline: existingPolyline,
      duracionEstimada: existingDuration,
      mapAvailable: Boolean(existingPolyline && existingDuration != null),
      mapNoDisponible: isZeroResults ? true : Boolean(mapNoDisponibleVigente),
      mapNoDisponibleAt: isZeroResults
        ? new Date().toISOString()
        : (mapNoDisponibleAt ? mapNoDisponibleAt.toISOString() : null),
      mapError: isQuotaOrPermissions
        ? 'Cuota o permisos de Google Directions agotados/inválidos'
        : isZeroResults
          ? 'No existe ruta en auto entre estos puntos'
          : 'No hay datos de mapa disponibles'
    };
  }
}

module.exports = {
  fetchDirections,
  ensureRouteMapData
};