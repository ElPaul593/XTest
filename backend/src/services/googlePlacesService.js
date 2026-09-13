const axios = require('axios');
const { getProvinciaFromCiudad, getCiudadesDeProvincia } = require('../utils/provinciaUtils');

const GOOGLE_PLACES_TEXTSEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const GOOGLE_PLACES_PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || '';
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildSearchQueries({ ciudad, provincia } = {}) {
  const ciudadNormalizada = normalizeText(ciudad);
  const provinciaNormalizada = normalizeText(provincia);
  const provinciaInferida = ciudadNormalizada ? getProvinciaFromCiudad(ciudadNormalizada) : null;
  const provinciaEfectiva = provinciaNormalizada || provinciaInferida;

  const queries = [];

  if (ciudadNormalizada) {
    queries.push(`hotels in ${ciudadNormalizada}, Ecuador`);
    if (provinciaEfectiva) {
      queries.push(`hotels in ${ciudadNormalizada}, ${provinciaEfectiva}, Ecuador`);
    }
  }

  if (!ciudadNormalizada && provinciaEfectiva) {
    const ciudadesProvincia = getCiudadesDeProvincia(provinciaEfectiva);
    for (const ciudadProvincia of ciudadesProvincia) {
      queries.push(`hotels in ${ciudadProvincia}, ${provinciaEfectiva}, Ecuador`);
    }

    queries.push(`hotels in ${provinciaEfectiva}, Ecuador`);
  }

  return uniqueValues(queries);
}

function mapSearchResultToHotel(result, ciudad) {
  const location = result?.geometry?.location || {};

  return {
    googlePlaceId: result.place_id,
    nombre: result.name || 'Hotel',
    ciudad,
    direccion: result.formatted_address || result.vicinity || ciudad,
    descripcion: '',
    telefono: '',
    email: '',
    precioPromedio: null,
    ratingGoogle: typeof result.rating === 'number' ? result.rating : null,
    totalRatingsGoogle: typeof result.user_ratings_total === 'number' ? result.user_ratings_total : null,
    lat: typeof location.lat === 'number' ? location.lat : null,
    lng: typeof location.lng === 'number' ? location.lng : null
  };
}

async function searchTextResults(query) {
  const apiKey = getApiKey();
  if (!apiKey || !query) {
    return [];
  }

  try {
    const response = await axios.get(GOOGLE_PLACES_TEXTSEARCH_URL, {
      params: {
        query,
        type: 'lodging',
        language: 'es',
        region: 'ec',
        key: apiKey
      },
      timeout: 10000
    });

    if (response.data?.status && !['OK', 'ZERO_RESULTS'].includes(response.data.status)) {
      console.warn(`[googlePlacesService] Text Search status inesperado: ${response.data.status}`);
      return [];
    }

    return Array.isArray(response.data?.results) ? response.data.results : [];
  } catch (error) {
    console.warn(`[googlePlacesService] Error en Text Search: ${error.message}`);
    return [];
  }
}

async function searchHotelsByLocation({ ciudad, provincia } = {}) {
  const queries = buildSearchQueries({ ciudad, provincia });
  if (queries.length === 0) {
    return [];
  }

  const hotelesMap = new Map();

  for (const query of queries) {
    const results = await searchTextResults(query);

    for (const result of results) {
      if (!result?.place_id || hotelesMap.has(result.place_id)) {
        continue;
      }

      hotelesMap.set(result.place_id, mapSearchResultToHotel(result, normalizeText(ciudad)));
    }
  }

  return [...hotelesMap.values()];
}

async function fetchPhotoBufferByPlaceId(googlePlaceId) {
  const apiKey = getApiKey();
  if (!apiKey || !googlePlaceId) {
    return null;
  }

  try {
    const detailsResponse = await axios.get(GOOGLE_PLACES_DETAILS_URL, {
      params: {
        place_id: googlePlaceId,
        fields: 'photos',
        language: 'es',
        key: apiKey
      },
      timeout: 10000
    });

    const photoReference = detailsResponse.data?.result?.photos?.[0]?.photo_reference;
    if (!photoReference) {
      return null;
    }

    const photoResponse = await axios.get(GOOGLE_PLACES_PHOTO_URL, {
      params: {
        photoreference: photoReference,
        maxwidth: 1200,
        key: apiKey
      },
      responseType: 'arraybuffer',
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400
    });

    return {
      buffer: Buffer.from(photoResponse.data),
      contentType: photoResponse.headers['content-type'] || 'image/jpeg'
    };
  } catch (error) {
    console.warn(`[googlePlacesService] No se pudo obtener foto para ${googlePlaceId}: ${error.message}`);
    return null;
  }
}

module.exports = {
  buildSearchQueries,
  searchHotelsByLocation,
  fetchPhotoBufferByPlaceId
};