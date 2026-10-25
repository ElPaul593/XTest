const Calificacion = require('../models/calificacionModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de calificaciones.
 * Proporciona múltiples métodos especializados de búsqueda y filtrado.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de calificaciones con múltiples criterios.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Calificacion.
 */

exports.findAll = async (filters = {}) => {
  return Calificacion.find(filters).populate('usuario', 'nombre apellido paisOrigen provincia').sort({ fecha: -1 }).lean();
};

exports.findByTipoYReferencia = async (tipo, referencia) => {
  return Calificacion.find({ tipo, referencia })
    .populate('usuario', 'nombre apellido paisOrigen provincia')
    .sort({ fecha: -1 })
    .lean();
};

/**
 * Búsqueda en lote: todas las calificaciones de un tipo para un conjunto de referencias.
 * Evita el problema N+1 al recomendar (una sola consulta en lugar de una por lugar/hotel).
 */
exports.findByTipoYReferenciaIn = async (tipo, referencias = []) => {
  if (!Array.isArray(referencias) || referencias.length === 0) return [];
  return Calificacion.find({ tipo, referencia: { $in: referencias } })
    .populate('usuario', 'nombre apellido paisOrigen provincia')
    .sort({ fecha: -1 })
    .lean();
};

exports.findByUsuario = async (usuarioId) => {
  return Calificacion.find({ usuario: usuarioId })
    .populate('usuario', 'nombre apellido paisOrigen provincia')
    .sort({ fecha: -1 })
    .lean();
};

exports.findById = async (id) => {
  return Calificacion.findById(id).populate('usuario', 'nombre apellido paisOrigen provincia').lean();
};

exports.create = async (data) => {
  const calificacion = new Calificacion(data);
  return calificacion.save();
};

exports.updateById = async (id, data) => {
  return Calificacion.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).populate('usuario', 'nombre apellido paisOrigen').lean();
};

exports.deleteById = async (id) => {
  return Calificacion.findByIdAndDelete(id).lean();
};

/*
 * #4BUG, #5BUG y #6BUG — CORREGIDOS: se eliminaron tres métodos sin uso.
 *
 *  · `findByTipoYReferenciaConNacionalidad` — resto de una versión anterior del
 *    motor de recomendaciones que ponderaba por nacionalidad. El algoritmo vigente
 *    agrupa por provincia.
 *
 *  · `findCalificacionesMesActual` — la métrica que debía alimentar
 *    (`calificacionesMesActual`) salía siempre 0 porque nadie llamaba al método.
 *    Ahora el dato se calcula de verdad en `core/recommendationCore.js` a partir de
 *    las calificaciones que ya están cargadas en memoria, SIN consultas
 *    adicionales: una consulta por lugar habría reintroducido el problema N+1 que
 *    ese archivo justamente resolvió.
 *
 *  · `findByTipoYReferenciaYProvincia` — duplicaba en MongoDB un filtrado que el
 *    core ya hace sobre datos cargados; mantenerlo obligaría a dos consultas donde
 *    basta una.
 *
 * El método vivo que usa el motor de recomendaciones es `findByTipoYReferenciaIn`.
 */
// ELIMINADO (#4BUG): findByTipoYReferenciaConNacionalidad
// ELIMINADO (#5BUG): findCalificacionesMesActual
// ELIMINADO (#6BUG): findByTipoYReferenciaYProvincia
