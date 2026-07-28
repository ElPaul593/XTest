const RecomendacionService = require('../services/recomendacionService');
const User = require('../models/userModel');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para recomendaciones.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para recomendaciones.
 * Valida parámetros y delega la lógica de negocio al servicio.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción RecomendacionService.
 */

/**
 * Endpoint: Ver Recomendados
 * Obtiene recomendaciones personalizadas basadas en la provincia de origen del usuario
 * y la ciudad de destino. Solo considera calificaciones de usuarios de la misma provincia.
 * 
 * Query params:
 * - ciudadDestino: Ciudad de destino (requerido)
 * - usuarioId: ID del usuario (opcional, si no se proporciona usa req.user.id)
 * - rutaId: ID de la ruta (opcional, para obtener recomendaciones guardadas)
 */
exports.verRecomendados = async (req, res) => {
  try {
    const { ciudadDestino, rutaId } = req.query;
    const usuarioId = req.query.usuarioId || req.user?.id;
    
    if (!ciudadDestino) {
      return res.status(400).json({ error: 'Ciudad de destino es requerida' });
    }

    if (!usuarioId) {
      return res.status(400).json({ error: 'Usuario ID es requerido' });
    }

    // Obtener información del usuario
    const usuario = await User.findById(usuarioId)
      .select('provincia paisOrigen nombre apellido')
      .lean();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si el usuario no tiene provincia (extranjero o sin cédula), retornar error
    if (!usuario.provincia) {
      return res.status(400).json({ 
        error: 'El usuario debe tener una provincia asignada. Solo usuarios ecuatorianos pueden recibir recomendaciones personalizadas.' 
      });
    }

    // Obtener recomendaciones usando el algoritmo por provincia
    const recomendados = await RecomendacionService.getRecomendadosPorProvincia(
      usuario.provincia,
      ciudadDestino,
      usuarioId
    );

    res.json({
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        provincia: usuario.provincia
      },
      ciudadDestino,
      totalRecomendaciones: recomendados.length,
      recomendados
    });
  } catch (err) {
    console.error('Error en verRecomendados:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Endpoint: Obtener recomendaciones guardadas
 * Obtiene las recomendaciones guardadas en la colección hija para un usuario y ruta específica
 */
exports.getRecomendadosGuardados = async (req, res) => {
  try {
    const { usuarioId, rutaId } = req.query;
    const userId = usuarioId || req.user?.id;

    if (!userId || !rutaId) {
      return res.status(400).json({ error: 'Usuario ID y Ruta ID son requeridos' });
    }

    const recomendados = await RecomendacionService.getRecomendadosGuardados(userId, rutaId);
    
    res.json({
      totalRecomendaciones: recomendados.length,
      recomendados
    });
  } catch (err) {
    console.error('Error en getRecomendadosGuardados:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Endpoint original (mantener compatibilidad)
 * Obtiene recomendaciones por nacionalidad (método anterior)
 */
exports.getRecomendados = async (req, res) => {
  try {
    const { ciudad, tipo = 'lugarTuristico', usuarioId } = req.query;
    
    if (!ciudad) {
      return res.status(400).json({ error: 'Ciudad es requerida' });
    }

    let recomendados;
    
    if (usuarioId) {
      const usuario = await User.findById(usuarioId)
        .select('paisOrigen provincia')
        .lean();

      // Si el usuario tiene provincia, usar el nuevo algoritmo
      if (usuario && usuario.provincia) {
        console.log(`[Recomendaciones] Usuario ${usuarioId} de provincia ${usuario.provincia} buscando lugares en ${ciudad}`);
        recomendados = await RecomendacionService.getRecomendadosPorProvincia(
          usuario.provincia,
          ciudad,
          usuarioId
        );
        console.log(`[Recomendaciones] Encontrados ${recomendados.length} lugares recomendados`);
      } else if (usuario && usuario.paisOrigen) {
        // Fallback al método anterior por nacionalidad
        recomendados = await RecomendacionService.getRecomendadosPorNacionalidad(
          usuario.paisOrigen,
          ciudad,
          tipo
        );
      } else {
        recomendados = await RecomendacionService.getRecomendadosGenerales(ciudad, tipo);
      }
    } else {
      recomendados = await RecomendacionService.getRecomendadosGenerales(ciudad, tipo);
    }

    res.json(recomendados);
  } catch (err) {
    console.error('[Recomendaciones] Error en getRecomendados:', err);
    res.status(500).json({ error: err.message || 'Error al obtener recomendaciones' });
  }
};
