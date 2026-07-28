const express = require('express');
const router = express.Router();
const boletoController = require('../controllers/boletoController');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { boletoSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Boletos
 *   description: Gestión de boletos de autobuses
 */

/**
 * @swagger
 * /api/boletos:
 *   get:
 *     summary: Obtener todos los boletos (Admin)
 *     tags: [Boletos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de boletos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Boleto'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.get('/', authenticateToken, requireAdminAccess, boletoController.getAll);

/**
 * @swagger
 * /api/boletos:
 *   post:
 *     summary: Crear un nuevo boleto
 *     tags: [Boletos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reserva
 *             properties:
 *               reserva:
 *                 type: string
 *                 description: ID de la reserva
 *     responses:
 *       201:
 *         description: Boleto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Boleto'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, validate(boletoSchemas.create, 'body'), boletoController.create);

module.exports = router;
