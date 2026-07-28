const mongoose = require('mongoose');

/**
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

