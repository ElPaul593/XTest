const LugarTuristicoRepo = require('../repositories/lugarTuristicoRepo');
const LugarTuristico = require('../models/lugarTuristicoModel');
const { lugaresTuristicos } = require('../data/seedData');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para lugares turísticos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para lugares turísticos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción LugarTuristicoRepo.
 */

exports.getAll = async (filters = {}) => {
  return LugarTuristicoRepo.findAll(filters);
};

exports.getByCiudad = async (ciudad) => {
  return LugarTuristicoRepo.findByCiudad(ciudad);
};

exports.getById = async (id) => {
  const lugar = await LugarTuristicoRepo.findById(id);
  if (!lugar) throw new Error('Lugar turístico no encontrado');
  return lugar;
};

exports.create = async (data) => {
  return LugarTuristicoRepo.create(data);
};

exports.update = async (id, data) => {
  const lugar = await LugarTuristicoRepo.findById(id);
  if (!lugar) throw new Error('Lugar turístico no encontrado');
  return LugarTuristicoRepo.updateById(id, data);
};

exports.delete = async (id) => {
  const lugar = await LugarTuristicoRepo.findById(id);
  if (!lugar) throw new Error('Lugar turístico no encontrado');
  return LugarTuristicoRepo.deleteById(id);
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado exclusivamente a poblar la base de datos con lugares turísticos.
 */
exports.seedLugaresTuristicos = async (clearExisting = false) => {
  try {
    if (clearExisting) {
      await LugarTuristico.deleteMany({});
    }

    const lugaresInsertados = [];
    for (const lugarData of lugaresTuristicos) {
      const lugar = await LugarTuristicoRepo.create(lugarData);
      lugaresInsertados.push(lugar);
    }

    return {
      success: true,
      count: lugaresInsertados.length,
      lugares: lugaresInsertados
    };
  } catch (error) {
    throw new Error(`Error al poblar lugares turísticos: ${error.message}`);
  }
};

