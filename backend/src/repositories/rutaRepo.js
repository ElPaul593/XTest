const Ruta = require('../models/rutaModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de rutas.
 * Proporciona métodos específicos de búsqueda (por origen, destino).
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de rutas con búsquedas especializadas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo Ruta.
 */

exports.findAll = async () => Ruta.find().lean();

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica de búsqueda por destino con normalización y regex.
 */
exports.findByDestino = async (ciudadDestino) => {
  const ciudadNormalizada = ciudadDestino ? ciudadDestino.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Búsqueda case-insensitive
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Ruta.find({ 
    to: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).lean();
};

/*
 * #9BUG — CORREGIDO: se eliminó `findByOrigen`, que no se invocaba nunca.
 * Su pareja `findByDestino` sí se usa (core/recommendationCore.js); la búsqueda
 * por ciudad de ORIGEN se resuelve de otra forma: el core obtiene las rutas por
 * destino y compara `r.from` en memoria contra las ciudades de la provincia.
 */

exports.findById = async (id) => Ruta.findById(id).lean();

exports.create = async (data) => {
  const r = new Ruta(data);
  return r.save();
};

exports.updateById = async (id, data) => Ruta.findByIdAndUpdate(
  id,
  { $set: data },
  { new: true, runValidators: true }
).lean();

exports.deleteById = async (id) => Ruta.findByIdAndDelete(id).lean();
