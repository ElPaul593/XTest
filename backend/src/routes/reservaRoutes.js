const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const Reserva = require('../models/reservaModel');
const { authenticateToken, requireAdminAccess, authorizeOwnerOrAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { reservaSchemas } = require('../validations/schemas');
const asyncHandler = require('../utils/asyncHandler');
const { serializeReserva } = require('../utils/serializers');

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestión de reservas de autobuses
 */

/**
 * @swagger
 * /api/reservas:
 *   get:
 *     summary: Obtener todas las reservas (Admin)
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reserva'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.get(
  '/',
  authenticateToken,
  requireAdminAccess,
  validate(reservaSchemas.query, 'query'),
  reservaController.getAll
);

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruta
 *               - seatNumber
 *             properties:
 *               ruta:
 *                 type: string
 *                 description: ID de la ruta
 *               seatNumber:
 *                 type: integer
 *                 description: Número de asiento
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/',
  authenticateToken,
  validate(reservaSchemas.create, 'body'),
  reservaController.create
);

/**
 * @swagger
 * /api/reservas/mine:
 *   get:
 *     summary: Obtener mis reservas
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de mis reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reserva'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: No autorizado
 */
router.get('/mine', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [list, total] = await Promise.all([
    Reserva.find({ user: req.user._id })
      .populate('ruta', 'from to price duration horaSalida duracionEstimada polyline')
      .lean()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Reserva.countDocuments({ user: req.user._id })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    data: list.map(serializeReserva),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages
    }
  });
}));

/**
 * @swagger
 * /api/reservas/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reserva cancelada exitosamente
 *       404:
 *         description: Reserva no encontrada
 */
router.delete('/:id', authenticateToken, authorizeOwnerOrAdmin(Reserva, 'user'), reservaController.cancel);

module.exports = router;
