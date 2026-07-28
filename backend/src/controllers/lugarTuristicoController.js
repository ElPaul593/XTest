const LugarTuristicoService = require('../services/lugarTuristicoService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para lugares turísticos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para lugares turísticos.
 * Incluye normalización de parámetros de query (ciudad).
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción LugarTuristicoService.
 */

exports.getAll = async (req, res) => {
  try {
    const { ciudad } = req.query;
    // Normalizar ciudad: trim y asegurar que no esté vacío
    const ciudadNormalizada = ciudad ? ciudad.trim() : null;
    
    const lugares = ciudadNormalizada 
      ? await LugarTuristicoService.getByCiudad(ciudadNormalizada)
      : await LugarTuristicoService.getAll();
    
    res.json(lugares || []);
  } catch (err) {
    console.error('Error en getAll lugares turísticos:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const lugar = await LugarTuristicoService.getById(req.params.id);
    res.json(lugar);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const lugar = await LugarTuristicoService.create(req.body);
    res.status(201).json(lugar);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const lugar = await LugarTuristicoService.update(req.params.id, req.body);
    res.json(lugar);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await LugarTuristicoService.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.seedLugaresTuristicos = async (req, res) => {
  try {
    const { clearExisting } = req.body;
    const result = await LugarTuristicoService.seedLugaresTuristicos(clearExisting);
    res.status(200).json({ 
      message: 'Lugares turísticos poblados exitosamente', 
      ...result 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};