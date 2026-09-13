const CalificacionRepo = require('../repositories/calificacionRepo');
const HotelRepo = require('../repositories/hotelRepo');
const LugarTuristicoRepo = require('../repositories/lugarTuristicoRepo');
const RecommendationCore = require('../core/recommendationCore');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern / Strategy Pattern
 * Este servicio actúa como un adaptador/fachada que proporciona múltiples
 * estrategias de recomendación (por nacionalidad, por provincia, generales).
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: coordinar diferentes algoritmos de recomendación.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de abstracciones (repositorios y RecommendationCore).
 * 
 * PATRÓN DE DISEÑO: Strategy Pattern (implícito)
 * Proporciona diferentes estrategias de recomendación que pueden intercambiarse.
 */

/**
 * PATRÓN STRATEGY: Estrategia de recomendación por nacionalidad
 * Algoritmo de recomendaciones personalizado por nacionalidad.
 * Prioriza:
 * 1. Votaciones del mes en curso (peso mayor)
 * 2. Calificaciones de usuarios de la misma nacionalidad
 * 3. Calificaciones recientes (últimos 3 meses)
 * 4. Rating promedio general
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado exclusivamente a generar recomendaciones por nacionalidad.
 */
exports.getRecomendadosPorNacionalidad = async (paisOrigen, ciudad, tipo = 'lugarTuristico') => {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hace3Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);

  // Obtener todos los lugares/hoteles de la ciudad
  const items = tipo === 'hotel' 
    ? await HotelRepo.findByCiudad(ciudad)
    : await LugarTuristicoRepo.findByCiudad(ciudad);

  if (items.length === 0) return [];

  // Obtener todas las calificaciones de estos items en UNA sola consulta (evita N+1)
  const itemIds = items.map(i => i._id);
  const todasLasCalificaciones = await CalificacionRepo.findByTipoYReferenciaIn(tipo, itemIds);
  const calificacionesPorItem = new Map();
  for (const c of todasLasCalificaciones) {
    const key = String(c.referencia);
    if (!calificacionesPorItem.has(key)) calificacionesPorItem.set(key, []);
    calificacionesPorItem.get(key).push(c);
  }

  const itemsConCalificaciones = items.map((item) => {
      const todasCalificaciones = calificacionesPorItem.get(String(item._id)) || [];
      const calificacionesMesActual = todasCalificaciones.filter(
        c => new Date(c.fecha) >= inicioMes
      );
      const calificacionesRecientes = todasCalificaciones.filter(
        c => new Date(c.fecha) >= hace3Meses
      );
      const calificacionesMismaNacionalidad = todasCalificaciones.filter(
        c => c.usuario && c.usuario.paisOrigen === paisOrigen
      );
      const calificacionesMesMismaNacionalidad = calificacionesMesActual.filter(
        c => c.usuario && c.usuario.paisOrigen === paisOrigen
      );

      // Calcular scores
      const promedioGeneral = todasCalificaciones.length > 0
        ? todasCalificaciones.reduce((sum, c) => sum + c.calificacion, 0) / todasCalificaciones.length
        : 0;

      const promedioMismaNacionalidad = calificacionesMismaNacionalidad.length > 0
        ? calificacionesMismaNacionalidad.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesMismaNacionalidad.length
        : 0;

      const promedioMesActual = calificacionesMesActual.length > 0
        ? calificacionesMesActual.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesMesActual.length
        : 0;

      const promedioMesMismaNacionalidad = calificacionesMesMismaNacionalidad.length > 0
        ? calificacionesMesMismaNacionalidad.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesMesMismaNacionalidad.length
        : 0;

      const promedioRecientes = calificacionesRecientes.length > 0
        ? calificacionesRecientes.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesRecientes.length
        : 0;

      // Algoritmo de scoring ponderado
      // Peso 1: Votaciones del mes actual de misma nacionalidad (40%)
      // Peso 2: Votaciones del mes actual general (25%)
      // Peso 3: Votaciones recientes (últimos 3 meses) de misma nacionalidad (20%)
      // Peso 4: Promedio general de misma nacionalidad (10%)
      // Peso 5: Promedio general (5%)

      let score = 0;
      let totalPeso = 0;

      // Si hay votaciones del mes actual de misma nacionalidad, darle máximo peso
      if (calificacionesMesMismaNacionalidad.length > 0) {
        score += promedioMesMismaNacionalidad * 0.4;
        totalPeso += 0.4;
      }

      // Votaciones del mes actual general
      if (calificacionesMesActual.length > 0) {
        score += promedioMesActual * 0.25;
        totalPeso += 0.25;
      }

      // Votaciones recientes de misma nacionalidad
      if (calificacionesRecientes.some(c => c.usuario && c.usuario.paisOrigen === paisOrigen)) {
        const recientesMismaNacionalidad = calificacionesRecientes.filter(
          c => c.usuario && c.usuario.paisOrigen === paisOrigen
        );
        const promedioRecientesMismaNacionalidad = recientesMismaNacionalidad.reduce(
          (sum, c) => sum + c.calificacion, 0
        ) / recientesMismaNacionalidad.length;
        score += promedioRecientesMismaNacionalidad * 0.2;
        totalPeso += 0.2;
      }

      // Promedio de misma nacionalidad
      if (calificacionesMismaNacionalidad.length > 0) {
        score += promedioMismaNacionalidad * 0.1;
        totalPeso += 0.1;
      }

      // Promedio general
      if (todasCalificaciones.length > 0) {
        score += promedioGeneral * 0.05;
        totalPeso += 0.05;
      }

      // Normalizar el score si hay pesos aplicados
      const scoreFinal = totalPeso > 0 ? score / totalPeso : 0;

      // Factor de confianza basado en cantidad de votos recientes
      const factorConfianza = Math.min(
        1,
        (calificacionesMesActual.length * 0.5 + calificacionesRecientes.length * 0.3) / 10
      );

      // Score ajustado con factor de confianza
      const scoreAjustado = scoreFinal * (0.7 + factorConfianza * 0.3);

      return {
        ...item,
        score: scoreAjustado,
        promedioGeneral,
        promedioMismaNacionalidad,
        totalCalificaciones: todasCalificaciones.length,
        calificacionesMesActual: calificacionesMesActual.length,
        calificacionesMismaNacionalidad: calificacionesMismaNacionalidad.length
      };
    });

  // Filtrar items con al menos una calificación y ordenar por score
  const recomendados = itemsConCalificaciones
    .filter(item => item.totalCalificaciones > 0)
    .sort((a, b) => b.score - a.score);

  return recomendados;
};

/**
 * PATRÓN STRATEGY: Estrategia de recomendación general
 * Obtener recomendados generales (sin filtro de nacionalidad)
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado exclusivamente a generar recomendaciones generales.
 */
exports.getRecomendadosGenerales = async (ciudad, tipo = 'lugarTuristico') => {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const items = tipo === 'hotel' 
    ? await HotelRepo.findByCiudad(ciudad)
    : await LugarTuristicoRepo.findByCiudad(ciudad);

  if (items.length === 0) return [];

  const itemIds = items.map(i => i._id);
  const todasLasCalificaciones = await CalificacionRepo.findByTipoYReferenciaIn(tipo, itemIds);
  const calificacionesPorItem = new Map();
  for (const c of todasLasCalificaciones) {
    const key = String(c.referencia);
    if (!calificacionesPorItem.has(key)) calificacionesPorItem.set(key, []);
    calificacionesPorItem.get(key).push(c);
  }

  const itemsConCalificaciones = items.map((item) => {
      const todasCalificaciones = calificacionesPorItem.get(String(item._id)) || [];
      const calificacionesMesActual = todasCalificaciones.filter(
        c => new Date(c.fecha) >= inicioMes
      );

      const promedioGeneral = todasCalificaciones.length > 0
        ? todasCalificaciones.reduce((sum, c) => sum + c.calificacion, 0) / todasCalificaciones.length
        : 0;

      const promedioMesActual = calificacionesMesActual.length > 0
        ? calificacionesMesActual.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesMesActual.length
        : 0;

      // Priorizar votaciones del mes actual (70%) sobre promedio general (30%)
      const score = promedioMesActual > 0
        ? promedioMesActual * 0.7 + promedioGeneral * 0.3
        : promedioGeneral;

      return {
        ...item,
        score,
        promedioGeneral,
        totalCalificaciones: todasCalificaciones.length,
        calificacionesMesActual: calificacionesMesActual.length
      };
    });

  return itemsConCalificaciones
    .filter(item => item.totalCalificaciones > 0)
    .sort((a, b) => b.score - a.score);
};

/**
 * PATRÓN STRATEGY: Estrategia de recomendación por provincia
 * PATRÓN DE DISEÑO: Delegation Pattern
 * Este método delega la implementación al RecommendationCore, actuando como
 * un adaptador entre el servicio y el core de recomendaciones.
 * 
 * Obtener recomendaciones personalizadas por provincia de origen.
 * Este es el método principal que usa el algoritmo de recomendaciones por provincia.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: delegar al core de recomendaciones.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción RecommendationCore.
 */
exports.getRecomendadosPorProvincia = async (provinciaOrigen, ciudadDestino, usuarioId = null, preferenciasUsuario = []) => {
  return await RecommendationCore.getRecomendadosPorProvincia(provinciaOrigen, ciudadDestino, usuarioId, preferenciasUsuario);
};

/**
 * Obtener recomendaciones guardadas de la colección hija
 */
exports.getRecomendadosGuardados = async (usuarioId, rutaId) => {
  return await RecommendationCore.getRecomendadosGuardados(usuarioId, rutaId);
};

/**
 * Obtener recomendaciones por provincia y destino desde la colección hija
 */
exports.getRecomendadosPorProvinciaYDestino = async (provinciaOrigen, ciudadDestino) => {
  return await RecommendationCore.getRecomendadosPorProvinciaYDestino(provinciaOrigen, ciudadDestino);
};

