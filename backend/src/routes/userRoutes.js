const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdminAccess } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { userSchemas } = require('../validations/schemas');

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener mi perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { password, __v, ...safeUser } =
    user.toObject ? user.toObject() : user;

  res.json(safeUser);
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Actualizar mi perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               telefono:
 *                 type: string
 *               provincia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       401:
 *         description: No autorizado
 */
router.put('/me', authenticateToken, validate(userSchemas.update, 'body'), userController.updateMe);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios (Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.get('/', authenticateToken, requireAdminAccess, userController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener un usuario por ID (Admin)
 *     tags: [Usuarios]
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
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authenticateToken, requireAdminAccess, userController.getOne);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario (Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - cedula
 *               - nombre
 *               - apellido
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               cedula:
 *                 type: string
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               telefono:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
router.post('/', authenticateToken, requireAdminAccess, validate(userSchemas.create, 'body'), userController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar un usuario (Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               telefono:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', authenticateToken, requireAdminAccess, validate(userSchemas.update, 'body'), userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar un usuario (Admin)
 *     tags: [Usuarios]
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
 *         description: Usuario eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', authenticateToken, requireAdminAccess, userController.remove);

module.exports = router;
