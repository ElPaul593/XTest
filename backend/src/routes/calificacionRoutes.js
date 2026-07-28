const express = require('express');
const router = express.Router();
const calificacionController = require('../controllers/calificacionController');
const Calificacion = require('../models/calificacionModel');
const { authenticateToken, authorizeOwnerOrAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { calificacionSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Calificaciones
 *   description: Gestión de calificaciones y reseñas
 */

/**
 * @swagger
 * /api/calificaciones:
 *   get:
 *     summary: Obtener todas las calificaciones
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de calificaciones
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, calificacionController.getAll);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   get:
 *     summary: Obtener una calificación por ID
 *     tags: [Calificaciones]
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
 *         description: Datos de la calificación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Calificación no encontrada
 */
router.get('/:id', authenticateToken, calificacionController.getById);

/**
 * @swagger
 * /api/calificaciones:
 *   post:
 *     summary: Crear una nueva calificación
 *     tags: [Calificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Calificación creada exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, validate(calificacionSchemas.create, 'body'), calificacionController.create);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   put:
 *     summary: Actualizar una calificación
 *     tags: [Calificaciones]
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
 *         description: Calificación actualizada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.put('/:id', authenticateToken, authorizeOwnerOrAdmin(Calificacion, 'usuario'), validate(calificacionSchemas.update, 'body'), calificacionController.update);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   delete:
 *     summary: Eliminar una calificación
 *     tags: [Calificaciones]
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
 *         description: Calificación eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', authenticateToken, authorizeOwnerOrAdmin(Calificacion, 'usuario'), calificacionController.delete);

module.exports = router;
