const HotelService = require('../services/hotelService');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para hoteles.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para hoteles.
 * Incluye lógica de routing basada en query parameters (ciudad).
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción HotelService.
 */

exports.getAll = async (req, res) => {
  try {
    const { ciudad } = req.query;
    const hoteles = ciudad 
      ? await HotelService.getByCiudad(ciudad)
      : await HotelService.getAll();
    res.json(hoteles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const hotel = await HotelService.getById(req.params.id);
    res.json(hotel);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const hotel = await HotelService.create(req.body);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const hotel = await HotelService.update(req.params.id, req.body);
    res.json(hotel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await HotelService.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
