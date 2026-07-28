const express = require('express');
const router = express.Router();
const Reserva = require('../models/reservaModel');
const Boleto = require('../models/boletoModel');
const Ruta = require('../models/rutaModel');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @swagger
 * /api/stats/reservas:
 *   get:
 *     summary: Obtener estadísticas agregadas de reservas (Admin)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta
 *     responses:
 *       200:
 *         description: Estadísticas agregadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: object
 *                     porRuta:
 *                       type: array
 *                     porMes:
 *                       type: array
 */
/**
 * Endpoint NO trivial: Estadísticas agregadas de reservas
 * Utiliza agregaciones de MongoDB para generar estadísticas complejas
 */
router.get(
  '/reservas',
  authenticateToken,
  requireAdminAccess,
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    
    // Construir filtro de fecha
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    // Agregación compleja: estadísticas por ruta
    const statsByRoute = await Reserva.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'rutas',
          localField: 'ruta',
          foreignField: '_id',
          as: 'rutaInfo'
        }
      },
      { $unwind: '$rutaInfo' },
      {
        $group: {
          _id: {
            routeId: '$ruta',
            from: '$rutaInfo.from',
            to: '$rutaInfo.to'
          },
          totalReservas: { $sum: 1 },
          reservasActivas: {
            $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
          },
          reservasCanceladas: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          route: {
            id: '$_id.routeId',
            from: '$_id.from',
            to: '$_id.to'
          },
          totalReservas: 1,
          reservasActivas: 1,
          reservasCanceladas: 1
        }
      },
      { $sort: { totalReservas: -1 } }
    ]);

    // Estadísticas generales
    const totalReservas = await Reserva.countDocuments(dateFilter);
    const reservasActivas = await Reserva.countDocuments({
      ...dateFilter,
      status: 'reserved'
    });
    const reservasCanceladas = await Reserva.countDocuments({
      ...dateFilter,
      status: 'cancelled'
    });

    // Estadísticas por mes (agregación temporal)
    const statsByMonth = await Reserva.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.json({
      data: {
        general: {
          totalReservas,
          reservasActivas,
          reservasCanceladas,
          tasaCancelacion: totalReservas > 0 
            ? ((reservasCanceladas / totalReservas) * 100).toFixed(2) + '%'
            : '0%'
        },
        porRuta: statsByRoute,
        porMes: statsByMonth,
        periodo: {
          from: from || null,
          to: to || null
        }
      }
    });
  })
);

module.exports = router;

