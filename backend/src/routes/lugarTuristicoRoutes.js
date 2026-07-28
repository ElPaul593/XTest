const express = require('express');
const router = express.Router();
const lugarTuristicoController = require('../controllers/lugarTuristicoController');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { lugarTuristicoSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Lugares Turísticos
 *   description: Gestión de lugares turísticos
 */

/**
 * @swagger
 * /api/lugares-turisticos:
 *   get:
 *     summary: Obtener todos los lugares turísticos
 *     tags: [Lugares Turísticos]
 *     responses:
 *       200:
 *         description: Lista de lugares turísticos
 */
router.get('/', lugarTuristicoController.getAll);

/**
 * @swagger
 * /api/lugares-turisticos/{id}:
 *   get:
 *     summary: Obtener un lugar turístico por ID
 *     tags: [Lugares Turísticos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del lugar turístico
 *       404:
 *         description: Lugar turístico no encontrado
 */
router.get('/:id', lugarTuristicoController.getById);

/**
 * @swagger
 * /api/lugares-turisticos:
 *   post:
 *     summary: Crear un nuevo lugar turístico (Admin)
 *     tags: [Lugares Turísticos]
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
 *         description: Lugar turístico creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/', authenticateToken, requireAdminAccess, validate(lugarTuristicoSchemas.create, 'body'), lugarTuristicoController.create);

/**
 * @swagger
 * /api/lugares-turisticos/{id}:
 *   put:
 *     summary: Actualizar un lugar turístico (Admin)
 *     tags: [Lugares Turísticos]
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
 *         description: Lugar turístico actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.put('/:id', authenticateToken, requireAdminAccess, validate(lugarTuristicoSchemas.update, 'body'), lugarTuristicoController.update);

/**
 * @swagger
 * /api/lugares-turisticos/{id}:
 *   delete:
 *     summary: Eliminar un lugar turístico (Admin)
 *     tags: [Lugares Turísticos]
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
 *         description: Lugar turístico eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.delete('/:id', authenticateToken, requireAdminAccess, lugarTuristicoController.delete);

/**
 * @swagger
 * /api/lugares-turisticos/seed:
 *   post:
 *     summary: Poblar base de datos con lugares turísticos iniciales (Admin)
 *     tags: [Lugares Turísticos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lugares turísticos creados exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/seed', authenticateToken, requireAdminAccess, lugarTuristicoController.seedLugaresTuristicos);

module.exports = router;

