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
router.delete('/me', authenticateToken, userController.removeMe);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Dar de baja mi propia cuenta
 *     description: >
 *       Baja LÓGICA solicitada por el titular. La cuenta pasa a estado `ELIMINADO`
 *       y deja de poder iniciar sesión, pero el documento se conserva para que su
 *       historial de reservas, boletos y calificaciones siga siendo consultable.
 *       Reemplaza el flujo anterior, que llamaba a `DELETE /api/users/{id}` (ruta
 *       restringida a administradores) y por tanto fallaba con 403 para un usuario
 *       con rol USER.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta dada de baja correctamente
 *       401:
 *         description: No autorizado
 *       409:
 *         description: La cuenta ya estaba dada de baja
 */
router.delete('/me', authenticateToken, userController.removeMe);

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
router.post('/:id/restore', authenticateToken, requireAdminAccess, userController.restore);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Dar de baja un usuario (Admin)
 *     description: >
 *       Baja LÓGICA, no física: la cuenta pasa a estado `ELIMINADO` y el documento
 *       se conserva en la base de datos. De este modo las reservas, boletos y
 *       calificaciones asociadas mantienen su referencia al usuario y no se pierde
 *       el histórico. Para bloquear temporalmente sin dar de baja, usar
 *       `PATCH /api/users/{id}/estado`.
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
 *         description: Cuenta dada de baja correctamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: La cuenta ya estaba dada de baja
 */
router.delete('/:id', authenticateToken, requireAdminAccess, userController.remove);

/**
 * @swagger
 * /api/users/{id}/estado:
 *   patch:
 *     summary: Bloquear, reactivar o dar de baja una cuenta (Admin)
 *     description: >
 *       Sustituye al borrado de usuarios como herramienta de moderación.
 *       `BLOQUEADO` impide iniciar sesión e invalida los tokens ya emitidos,
 *       conservando todos los datos; `ACTIVO` reactiva la cuenta; `ELIMINADO`
 *       la da de baja. Un administrador no puede bloquearse a sí mismo.
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
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [ACTIVO, BLOQUEADO, ELIMINADO]
 *               motivo:
 *                 type: string
 *                 description: Texto que se muestra al usuario al intentar iniciar sesión.
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado no válido o auto-bloqueo de administrador
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: La cuenta ya estaba en ese estado
 */
router.patch(
  '/:id/estado',
  authenticateToken,
  requireAdminAccess,
  validate(userSchemas.cambiarEstado, 'body'),
  userController.cambiarEstado
);

module.exports = router;
