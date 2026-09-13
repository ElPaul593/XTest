const RutaService = require('../services/rutaService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Los controladores delegan la lógica de negocio a los servicios.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para rutas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción RutaService.
 */

exports.getAll = async (req, res) => {
  try {
    const rutas = await RutaService.getAll();
    res.json(rutas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ruta = await RutaService.getById(req.params.id);
    res.json(ruta);
  } catch (err) {
    if (err.message === 'Ruta no encontrada') return res.status(404).json({ error: err.message });
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID inválido' });
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const ruta = await RutaService.create(req.body);
    res.status(201).json(ruta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await RutaService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json({ message: 'Ruta eliminada correctamente' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'ID inválido' });
    res.status(500).json({ error: err.message });
  }
};

exports.seedRutas = async (req, res) => {
  try {
    const { clearExisting } = req.body;
    const result = await RutaService.seedRutas(clearExisting);
    res.status(200).json({ 
      message: 'Rutas pobladas exitosamente', 
      ...result 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};