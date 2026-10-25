const CalificacionRepo = require('../repositories/calificacionRepo');
const LugarTuristicoRepo = require('../repositories/lugarTuristicoRepo');
const RutaRepo = require('../repositories/rutaRepo');
const { getProvinciaFromCiudad, getCiudadesDeProvincia } = require('../utils/provinciaUtils');
const LugaresRecomendados = require('../models/lugaresRecomendadosModel');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern / Core Business Logic
 * Este módulo encapsula la lógica central del sistema de recomendaciones.
 * Implementa un algoritmo personalizado de recomendaciones basado en provincia.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de recomendaciones personalizadas por provincia.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de abstracciones (repositorios), no de implementaciones concretas.
 * Esto permite cambiar la implementación de los repositorios sin afectar este módulo.
 */

/**
 * Algoritmo de recomendaciones personalizado por provincia de origen
 * 
 Este algoritmo filtra las calificaciones SOLO de usuarios de la misma provincia
 de origen del usuario que solicita las recomendaciones. Por ejemplo:
 - Si un usuario de Loja busca recomendaciones para Guayaquil, solo se consideran
   las calificaciones de otros usuarios de Loja que hayan calificado lugares de Guayaquil
  Las calificaciones de usuarios de otras provincias (ej: Pichincha) NO influyen
 * 
 * Prioriza:
 * 1. Calificaciones de usuarios de la misma provincia (peso 100%)
 * 2. Promedio de calificaciones (1-5 estrellas)
 * 3. Cantidad de calificaciones (factor de confianza)
 */
/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado exclusivamente a generar recomendaciones basadas en provincia.
 * Implementa un algoritmo que filtra calificaciones por provincia de origen del usuario.
 */
exports.getRecomendadosPorProvincia = async (provinciaOrigen, ciudadDestino, usuarioId = null, preferenciasUsuario = []) => {
  try {
    // Validar que se proporcione provincia de origen
    if (!provinciaOrigen) {
      throw new Error('Provincia de origen es requerida');
    }

    if (!ciudadDestino) {
      throw new Error('Ciudad de destino es requerida');
    }

    // Obtener la provincia de destino desde la ciudad
    const provinciaDestino = getProvinciaFromCiudad(ciudadDestino);
    if (!provinciaDestino) {
      throw new Error(`No se pudo determinar la provincia para la ciudad: ${ciudadDestino}`);
    }

    // Obtener todos los lugares turísticos de la ciudad de destino
    const lugaresTuristicos = await LugarTuristicoRepo.findByCiudad(ciudadDestino);
    
    if (lugaresTuristicos.length === 0) {
      return [];
    }

    // Obtener TODAS las calificaciones de estos lugares en UNA sola consulta (evita N+1)
    const lugarIds = lugaresTuristicos.map(l => l._id);
    const todasLasCalificaciones = await CalificacionRepo.findByTipoYReferenciaIn('lugarTuristico', lugarIds);
    const calificacionesPorLugar = new Map();
    for (const c of todasLasCalificaciones) {
      const key = String(c.referencia);
      if (!calificacionesPorLugar.has(key)) calificacionesPorLugar.set(key, []);
      calificacionesPorLugar.get(key).push(c);
    }

    const preferenciasValidas = Array.isArray(preferenciasUsuario)
      ? preferenciasUsuario.filter(Boolean)
      : [];

    // Inicio del mes en curso, para la métrica `calificacionesMesActual`.
    // Se calcula una sola vez fuera del bucle.
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Procesar cada lugar usando el mapa precargado (sin consultas adicionales)
    const lugaresConCalificaciones = lugaresTuristicos.map((lugar) => {
        const todasCalificaciones = calificacionesPorLugar.get(String(lugar._id)) || [];

        // FILTRAR: Solo calificaciones de usuarios de la misma provincia de origen
        const calificacionesMismaProvincia = todasCalificaciones.filter(
          c => c.usuario && c.usuario.provincia === provinciaOrigen
        );

        // Si no hay calificaciones de usuarios de la misma provincia, retornar null
        if (calificacionesMismaProvincia.length === 0) {
          return null;
        }

        // Calcular promedio de calificaciones (1-5 estrellas)
        const promedioCalificaciones = calificacionesMismaProvincia.reduce(
          (sum, c) => sum + c.calificacion, 
          0
        ) / calificacionesMismaProvincia.length;

        // Factor de confianza basado en cantidad de calificaciones
        // Más calificaciones = mayor confianza
        const factorConfianza = Math.min(1, calificacionesMismaProvincia.length / 10);

        // Score final: promedio ajustado por factor de confianza
        // El score puede ser de 0 a 5
        let score = promedioCalificaciones * (0.7 + factorConfianza * 0.3);

        if (preferenciasValidas.length > 0 && preferenciasValidas.includes(lugar.tipo)) {
          score *= 1.2;
        }

        // #5BUG CORREGIDO: antes este dato se devolvía como literal 0 y la
        // métrica salía vacía en toda la aplicación. Se cuenta aquí, sobre las
        // calificaciones YA cargadas en memoria, para no añadir una consulta por
        // lugar (eso reintroduciría el problema N+1 que resuelve la carga única
        // con `findByTipoYReferenciaIn`).
        const calificacionesMesActual = todasCalificaciones.filter((c) => {
          const fecha = c.fecha || c.createdAt;
          return fecha && new Date(fecha) >= inicioMesActual;
        }).length;

        return {
          lugarTuristico: lugar,
          calificacionPromedio: promedioCalificaciones,
          totalCalificaciones: calificacionesMismaProvincia.length,
          totalCalificacionesGenerales: todasCalificaciones.length,
          calificacionesMesActual,
          score: score,
          provinciaOrigen: provinciaOrigen,
          ciudadDestino: ciudadDestino,
          provinciaDestino: provinciaDestino
        };
    });

    // Filtrar lugares que tienen calificaciones de la misma provincia
    const lugaresFiltrados = lugaresConCalificaciones.filter(item => item !== null);

    // Ordenar por score descendente (mejores primero)
    const lugaresOrdenados = [...lugaresFiltrados].sort((a, b) => b.score - a.score);

    // Si hay un usuarioId, guardar las recomendaciones en la colección hija
    if (usuarioId && lugaresOrdenados.length > 0) {
      // Obtener la ruta correspondiente (origen -> destino)
      // Buscar ciudades principales de la provincia de origen
      const ciudadesOrigen = getCiudadesDeProvincia(provinciaOrigen);
      
      // Buscar rutas que tengan como destino la ciudadDestino
      const rutasDestino = await RutaRepo.findByDestino(ciudadDestino);
      
      // Intentar encontrar una ruta que tenga como origen una ciudad de la provincia de origen
      let ruta = null;
      if (ciudadesOrigen.length > 0) {
        for (const ciudadOrigen of ciudadesOrigen) {
          const rutaEncontrada = rutasDestino.find(r => r.from === ciudadOrigen);
          if (rutaEncontrada) {
            ruta = rutaEncontrada;
            break;
          }
        }
      }
      
      // Si no se encontró, usar la primera ruta con el destino correcto
      if (!ruta && rutasDestino.length > 0) {
        ruta = rutasDestino[0];
      }
      
      if (ruta) {
        /**
         * #11BUG CORREGIDO (parte 1 de 2): de 2·N consultas a UNA sola.
         *
         * Antes, por cada lugar recomendado se hacía un `findOne` para ver si ya
         * existía la fila y después un `create` o un `findByIdAndUpdate`. Con N
         * lugares eso son 2·N viajes a MongoDB por cada petición de
         * recomendaciones, y era el principal coste del endpoint.
         *
         * Ahora se resuelve con un único `bulkWrite` de `updateOne` + `upsert`:
         * MongoDB decide por cada documento si lo inserta o lo actualiza, usando
         * la misma clave lógica que antes se comprobaba a mano
         * (usuario + lugarTuristico + ruta).
         *
         * La parte 2 de la corrección es que esta colección ya se LEE: ver
         * `getRecomendadosPorProvinciaYDestino` y su endpoint.
         */
        const operaciones = lugaresOrdenados.map((item) => ({
          updateOne: {
            filter: {
              usuario: usuarioId,
              lugarTuristico: item.lugarTuristico._id,
              ruta: ruta._id
            },
            update: {
              $set: {
                calificacionPromedio: item.calificacionPromedio,
                totalCalificaciones: item.totalCalificaciones,
                score: item.score,
                fechaCalculo: new Date()
              },
              // Los datos geográficos solo se escriben al insertar: no cambian
              // para una combinación usuario+lugar+ruta ya existente.
              $setOnInsert: {
                provinciaOrigen: provinciaOrigen,
                ciudadDestino: ciudadDestino,
                provinciaDestino: provinciaDestino,
                createdAt: new Date()
              }
            },
            upsert: true
          }
        }));

        if (operaciones.length > 0) {
          await LugaresRecomendados.bulkWrite(operaciones, { ordered: false });
        }
      }
    }

    // Retornar los lugares ordenados con información adicional
    // Formato compatible con el frontend
    const resultado = lugaresOrdenados.map(item => {
      const lugar = {
        ...item.lugarTuristico,
        // Propiedades para compatibilidad con frontend
        promedioGeneral: item.calificacionPromedio || 0, // Alias para el frontend
        calificacionPromedio: item.calificacionPromedio || 0,
        totalCalificaciones: item.totalCalificaciones || 0,
        totalCalificacionesGenerales: item.totalCalificacionesGenerales || item.totalCalificaciones || 0,
        score: item.score || 0,
        // Propiedades adicionales para el frontend
        calificacionesMesActual: item.calificacionesMesActual || 0,
        promedioMismaNacionalidad: item.calificacionPromedio || 0, // Para compatibilidad
        // Metadatos
        provinciaOrigen: item.provinciaOrigen,
        ciudadDestino: item.ciudadDestino,
        provinciaDestino: item.provinciaDestino
      };
      
      // Asegurar que _id existe
      if (!lugar._id && item.lugarTuristico?._id) {
        lugar._id = item.lugarTuristico._id;
      }
      
      return lugar;
    });
    
    console.log(`[RecommendationCore] Retornando ${resultado.length} recomendaciones para ${provinciaOrigen} -> ${ciudadDestino}`);
    return resultado;

  } catch (error) {
    console.error('Error en getRecomendadosPorProvincia:', error);
    throw error;
  }
};

/**
 * PATRÓN REPOSITORY: Método de acceso a datos guardados
 * Obtener recomendaciones guardadas de la colección hija para un usuario y ruta específica
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: recuperar recomendaciones previamente calculadas y guardadas.
 */
exports.getRecomendadosGuardados = async (usuarioId, rutaId) => {
  try {
    const recomendaciones = await LugaresRecomendados.find({
      usuario: usuarioId,
      ruta: rutaId
    })
      .populate('lugarTuristico')
      .populate('ruta')
      .populate('usuario', 'nombre apellido provincia')
      .sort({ score: -1 })
      .lean();

    return recomendaciones;
  } catch (error) {
    console.error('Error en getRecomendadosGuardados:', error);
    throw error;
  }
};

/**
 * #12BUG CORREGIDO: esta función era inalcanzable por HTTP. El servicio la
 * reexportaba, pero ningún controlador la llamaba y ninguna ruta la exponía: dos
 * capas de envoltorio para algo a lo que no se podía llegar.
 *
 * Ya tiene entrada: `GET /api/recomendaciones/guardados-por-provincia`. Con ello
 * la colección `LugaresRecomendados` pasa a tener un lector real (ver #11BUG).
 *
 * PATRÓN REPOSITORY: Método de acceso a datos guardados
 * Obtener recomendaciones guardadas por provincia de origen y ciudad de destino
 *
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: recuperar recomendaciones por criterios de provincia y destino.
 */
exports.getRecomendadosPorProvinciaYDestino = async (provinciaOrigen, ciudadDestino) => {
  try {
    const recomendaciones = await LugaresRecomendados.find({
      provinciaOrigen: provinciaOrigen,
      ciudadDestino: ciudadDestino
    })
      .populate('lugarTuristico')
      .populate('ruta')
      .sort({ score: -1 })
      .lean();

    return recomendaciones;
  } catch (error) {
    console.error('Error en getRecomendadosPorProvinciaYDestino:', error);
    throw error;
  }
};

