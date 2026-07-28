const BoletoService = require('../services/boletoService');
const asyncHandler = require('../utils/asyncHandler');
const { serializeBoleto } = require('../utils/serializers');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para boletos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para boletos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción BoletoService.
 */

exports.getAll = asyncHandler(async (req, res) => {
  const boletos = await BoletoService.getAll();
  
  res.json({
    data: boletos.map(serializeBoleto)
  });
});

exports.create = asyncHandler(async (req, res) => {
  const boleto = await BoletoService.create(req.body);
  
  res.status(201).json({
    data: serializeBoleto(boleto)
  });
});
