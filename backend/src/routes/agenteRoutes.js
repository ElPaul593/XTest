const express = require('express');
const router = express.Router();
const agenteController = require('../controllers/agenteController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Agente
 *   description: Verificación de boletos por el Agente de Turismo
 */

// Todas las rutas requieren sesión y rol AGENTE (admin también puede acceder).
const agenteAccess = [authenticateToken, authorizeRole(['agente', 'admin'])];

/**
 * @swagger
 * /api/agente/rutas:
 *   get:
 *     summary: Rutas asignadas al agente con conteo de pasajeros/verificados
 *     tags: [Agente]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de rutas asignadas
 *       403:
 *         description: Acceso denegado (solo agente/admin)
 */
router.get('/rutas', ...agenteAccess, agenteController.getRutas);

/**
 * @swagger
 * /api/agente/rutas/{rutaId}/pasajeros:
 *   get:
 *     summary: Lista de pasajeros (reservas activas) de una ruta y su estado de verificación
 *     tags: [Agente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rutaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pasajeros de la ruta
 */
router.get('/rutas/:rutaId/pasajeros', ...agenteAccess, agenteController.getPasajeros);

/**
 * @swagger
 * /api/agente/verificar:
 *   post:
 *     summary: Verifica un boleto a partir del contenido del QR (o ID de reserva)
 *     tags: [Agente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo]
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Contenido del QR o ID de la reserva
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 */
router.post('/verificar', ...agenteAccess, agenteController.verificar);

/**
 * @swagger
 * /api/agente/rutas/{rutaId}/pasajeros/{reservaId}/toggle:
 *   post:
 *     summary: Control manual de abordaje (marcar/desmarcar un pasajero)
 *     tags: [Agente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rutaId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pasajero actualizado
 */
router.post('/rutas/:rutaId/pasajeros/:reservaId/toggle', ...agenteAccess, agenteController.toggle);

module.exports = router;
