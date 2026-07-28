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

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica de búsqueda por origen con normalización y regex.
 */
exports.findByOrigen = async (ciudadOrigen) => {
  const ciudadNormalizada = ciudadOrigen ? ciudadOrigen.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Búsqueda case-insensitive
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Ruta.find({ 
    from: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).lean();
};

exports.findById = async (id) => Ruta.findById(id).lean();

exports.create = async (data) => {
  const r = new Ruta(data);
  return r.save();
};

exports.deleteById = async (id) => Ruta.findByIdAndDelete(id).lean();
