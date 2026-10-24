const mongoose = require('mongoose');

/**
 * #11BUG — CORREGIDO. Antes esta colección era de SOLO ESCRITURA: se escribía en
 * cada petición de recomendaciones y nada de lo guardado se volvía a leer.
 *
 * Las dos causas y su arreglo:
 *
 *  1. Coste de escritura. `core/recommendationCore.js` hacía un `findOne` más un
 *     `create`/`findByIdAndUpdate` por cada lugar: 2·N viajes a MongoDB por
 *     petición. Ahora es un único `bulkWrite` con `upsert`.
 *
 *  2. Nadie leía. El único lector real, `getRecomendadosGuardados`, estaba
 *     expuesto pero sin consumidor, y `getRecomendadosPorProvinciaYDestino` ni
 *     siquiera tenía controlador (#12BUG). Ahora ambos tienen endpoint y la
 *     colección funciona como lo que pretendía ser: una caché consultable de las
 *     recomendaciones ya calculadas.
 *
 * Queda una limitación conocida y asumida: los campos `score`,
 * `calificacionPromedio` y `fechaCalculo` envejecen en cuanto llega una
 * calificación nueva, porque nada los invalida. Por eso los endpoints de lectura
 * exponen `fechaCalculo`: quien consulta puede decidir si el dato le sirve.
 *
 * Modelo de Lugares Recomendados (Colección Hija)
 * Combina: Usuario, Lugar Turístico y Ruta (destino)
 * Almacena las recomendaciones personalizadas por provincia de origen
 */
const LugaresRecomendadosSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lugarTuristico: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LugarTuristico', 
    required: true 
  },
  ruta: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ruta', 
    required: true 
  },
  provinciaOrigen: { 
    type: String, 
    required: true 
  }, // Provincia de origen del usuario
  ciudadDestino: { 
    type: String, 
    required: true 
  }, // Ciudad de destino de la ruta
  provinciaDestino: { 
    type: String, 
    required: true 
  }, // Provincia de destino
  calificacionPromedio: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  }, // Promedio de calificaciones de usuarios de la misma provincia
  totalCalificaciones: { 
    type: Number, 
    default: 0 
  }, // Total de calificaciones de usuarios de la misma provincia
  score: { 
    type: Number, 
    required: true 
  }, // Score calculado por el algoritmo
  fechaCalculo: { 
    type: Date, 
    default: Date.now 
  }, // Fecha en que se calculó esta recomendación
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Índices para búsquedas eficientes
LugaresRecomendadosSchema.index({ usuario: 1, ruta: 1 });
LugaresRecomendadosSchema.index({ provinciaOrigen: 1, ciudadDestino: 1 });
LugaresRecomendadosSchema.index({ provinciaOrigen: 1, provinciaDestino: 1 });
LugaresRecomendadosSchema.index({ score: -1 });
LugaresRecomendadosSchema.index({ fechaCalculo: -1 });

module.exports = mongoose.model('LugaresRecomendados', LugaresRecomendadosSchema);

