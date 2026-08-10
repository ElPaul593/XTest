const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/rutaController');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { rutaSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Rutas
 *   description: Gestión de rutas de autobuses
 */

/**
 * @swagger
 * /api/rutas:
 *   get:
 *     summary: Obtener todas las rutas disponibles
 *     tags: [Rutas]
 *     responses:
 *       200:
 *         description: Lista de rutas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   from:
 *                     type: string
 *                   to:
 *                     type: string
 *                   price:
 *                     type: number
 *                   duration:
 *                     type: string
 */
router.get('/', rutaController.getAll);

/**
 * @swagger
 * /api/rutas/{id}:
 *   get:
 *     summary: Obtener una ruta por ID (y actualizar datos de mapa si faltan)
 *     tags: [Rutas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ruta obtenida exitosamente
 *       404:
 *         description: Ruta no encontrada
 */
router.get('/:id', rutaController.getById);

/**
 * @swagger
 * /api/rutas:
 *   post:
 *     summary: Crear una nueva ruta (Admin)
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - price
 *               - duration
 *               - horaSalida
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *               horaSalida:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ruta creada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/', authenticateToken, requireAdminAccess, validate(rutaSchemas.create, 'body'), rutaController.create);

/**
 * @swagger
 * /api/rutas/seed:
 *   post:
 *     summary: Poblar base de datos con rutas iniciales (Admin)
 *     tags: [Rutas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Rutas creadas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/seed', authenticateToken, requireAdminAccess, rutaController.seedRutas);

/**
 * @swagger
 * /api/rutas/{id}:
 *   delete:
 *     summary: Eliminar una ruta (Admin)
 *     tags: [Rutas]
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
 *         description: Ruta eliminada
 *       404:
 *         description: Ruta no encontrada
 */
router.delete('/:id', authenticateToken, requireAdminAccess, rutaController.remove);

module.exports = router;
