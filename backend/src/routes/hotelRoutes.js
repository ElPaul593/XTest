const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { hotelSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Hoteles
 *   description: Gestión de hoteles
 */

/**
 * @swagger
 * /api/hoteles:
 *   get:
 *     summary: Obtener todos los hoteles
 *     tags: [Hoteles]
 *     responses:
 *       200:
 *         description: Lista de hoteles
 */
router.get('/', hotelController.getAll);

/**
 * @swagger
 * /api/hoteles/{id}:
 *   get:
 *     summary: Obtener un hotel por ID
 *     tags: [Hoteles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del hotel
 *       404:
 *         description: Hotel no encontrado
 */
router.get('/:id', hotelController.getById);

/**
 * @swagger
 * /api/hoteles:
 *   post:
 *     summary: Crear un nuevo hotel (Admin)
 *     tags: [Hoteles]
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
 *         description: Hotel creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/', authenticateToken, requireAdminAccess, validate(hotelSchemas.create, 'body'), hotelController.create);

/**
 * @swagger
 * /api/hoteles/{id}:
 *   put:
 *     summary: Actualizar un hotel (Admin)
 *     tags: [Hoteles]
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
 *         description: Hotel actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.put('/:id', authenticateToken, requireAdminAccess, validate(hotelSchemas.update, 'body'), hotelController.update);

/**
 * @swagger
 * /api/hoteles/{id}:
 *   delete:
 *     summary: Eliminar un hotel (Admin)
 *     tags: [Hoteles]
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
 *         description: Hotel eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.delete('/:id', authenticateToken, requireAdminAccess, hotelController.delete);

module.exports = router;

