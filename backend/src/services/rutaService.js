const RutaRepo = require('../repositories/rutaRepo');
const Ruta = require('../models/rutaModel');
const { rutas } = require('../data/seedData');
const MapsService = require('./mapsService');
const { getCiudadesRegistradas, normalizarCiudadRegistrada } = require('../utils/provinciaUtils');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para rutas.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para rutas (incluyendo seeding).
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción RutaRepo, no de implementaciones concretas.
 */

exports.getAll = async () => {
  return RutaRepo.findAll();
};

exports.getCiudadesRegistradas = () => getCiudadesRegistradas();

async function validateRouteEndpoints(data, excludeId = null) {
  const from = normalizarCiudadRegistrada(data.from);
  const to = normalizarCiudadRegistrada(data.to);

  if (!from || !to) {
    throw new Error('El origen y el destino deben ser ciudades registradas');
  }
  if (from.localeCompare(to, 'es', { sensitivity: 'base' }) === 0) {
    throw new Error('El origen y el destino deben ser diferentes');
  }
  if (await RutaRepo.findByEndpoints(from, to, excludeId)) {
    throw new Error('Ya existe una ruta con ese origen y destino');
  }

  return { from, to };
}

exports.getById = async (id) => {
  const ruta = await RutaRepo.findById(id);
  if (!ruta) throw new Error('Ruta no encontrada');
  return MapsService.ensureRouteMapData(ruta);
};

exports.remove = async (id) => {
  return RutaRepo.deleteById(id);
};

exports.create = async (data) => {
  const payload = { ...data };
  const endpoints = await validateRouteEndpoints(payload);
  payload.from = endpoints.from;
  payload.to = endpoints.to;
  payload.duration = `${Number(payload.duration)} horas`;
  if (!payload.name && payload.from && payload.to) {
    payload.name = `${payload.from} - ${payload.to}`;
  }
  const ruta = await RutaRepo.create(payload);
  return MapsService.ensureRouteMapData(ruta);
};

exports.update = async (id, data) => {
  const payload = { ...data };
  const endpoints = await validateRouteEndpoints(payload, id);
  payload.from = endpoints.from;
  payload.to = endpoints.to;
  if (payload.from && payload.to) {
    payload.name = `${payload.from} - ${payload.to}`;
  }
  if (payload.duration !== undefined) {
    payload.duration = `${Number(payload.duration)} horas`;
  }
  const ruta = await RutaRepo.updateById(id, payload);
  return ruta ? MapsService.ensureRouteMapData(ruta) : null;
};

/**
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Método dedicado exclusivamente a poblar la base de datos con rutas iniciales.
 */
exports.seedRutas = async (clearExisting = false) => {
  try {
    if (clearExisting) {
      await Ruta.deleteMany({});
    }

    const rutasInsertadas = [];
    for (const rutaData of rutas) {
      const ruta = await RutaRepo.create(rutaData);
      rutasInsertadas.push(ruta);
    }

    return {
      success: true,
      count: rutasInsertadas.length,
      rutas: rutasInsertadas
    };
  } catch (error) {
    throw new Error(`Error al poblar rutas: ${error.message}`);
  }
};
