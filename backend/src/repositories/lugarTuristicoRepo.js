const LugarTuristico = require('../models/lugarTuristicoModel');

/**
 * PATRÓN DE DISEÑO: Repository Pattern
 * Repositorio que encapsula el acceso a datos de lugares turísticos.
 * Proporciona búsquedas especializadas con normalización y regex.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: acceso a datos de lugares turísticos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción del modelo LugarTuristico.
 */

exports.findAll = async (filters = {}) => {
  return LugarTuristico.find(filters).sort({ createdAt: -1 }).lean();
};

/**
 * PATRÓN REPOSITORY: Método especializado de búsqueda
 * Encapsula la lógica compleja de búsqueda por ciudad con normalización,
 * escape de caracteres especiales y búsqueda case-insensitive.
 */
exports.findByCiudad = async (ciudad) => {
  // Búsqueda case-insensitive y que ignore espacios al inicio/final
  const ciudadNormalizada = ciudad ? ciudad.trim() : '';
  if (!ciudadNormalizada) {
    return [];
  }
  
  // Escapar caracteres especiales para regex
  const ciudadEscapada = ciudadNormalizada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Usar expresión regular para búsqueda case-insensitive
  const lugares = await LugarTuristico.find({ 
    ciudad: { $regex: new RegExp(`^${ciudadEscapada}$`, 'i') }
  }).sort({ createdAt: -1 }).lean();
  
  console.log(`Buscando lugares para ciudad: "${ciudadNormalizada}", encontrados: ${lugares.length}`);
  
  return lugares;
};

exports.findById = async (id) => {
  return LugarTuristico.findById(id).lean();
};

exports.create = async (data) => {
  const lugar = new LugarTuristico(data);
  return lugar.save();
};

exports.updateById = async (id, data) => {
  return LugarTuristico.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
};

exports.deleteById = async (id) => {
  return LugarTuristico.findByIdAndDelete(id).lean();
};

