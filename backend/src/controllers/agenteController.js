const AgenteService = require('../services/agenteService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Maneja las peticiones HTTP del Agente de Turismo y delega en AgenteService.
 *
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: traducir HTTP <-> lógica de verificación de boletos.
 */

exports.getRutas = asyncHandler(async (req, res) => {
  const result = await AgenteService.getRutas(req.user);
  res.json(result);
});

exports.getPasajeros = asyncHandler(async (req, res) => {
  const result = await AgenteService.getPasajeros(req.user, req.params.rutaId);
  res.json(result);
});

exports.verificar = asyncHandler(async (req, res) => {
  const { codigo } = req.body;
  const result = await AgenteService.verificar(req.user, codigo);
  res.json(result);
});

exports.toggle = asyncHandler(async (req, res) => {
  const { verified } = req.body;
  const result = await AgenteService.toggle(req.user, req.params.reservaId, !!verified);
  res.json(result);
});
