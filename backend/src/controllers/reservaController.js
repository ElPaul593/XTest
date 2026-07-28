const ReservaService = require('../services/reservaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { serializeReserva } = require('../utils/serializers');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern (Controlador)
 * Controlador que maneja requests HTTP para reservas.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: manejar HTTP requests/responses para reservas.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción ReservaService.
 */

exports.getAll = asyncHandler(async (req, res) => {
  const { page, limit, status, userId, from, to } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    status,
    userId,
    from,
    to
  };

  const result = await ReservaService.getAll(options);

  // Serializar datos
  const serializedData = result.data.map(serializeReserva);

  res.json({
    data: serializedData,
    pagination: result.pagination
  });
});

exports.create = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    user: req.user.id
  };

  const reserva = await ReservaService.create(data);

  res.status(201).json({
    data: serializeReserva(reserva)
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reserva = await ReservaService.cancel(id);

  if (!reserva) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  res.json({
    message: 'Reserva cancelada exitosamente',
    data: serializeReserva(reserva)
  });
});
