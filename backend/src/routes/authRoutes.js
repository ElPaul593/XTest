const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validation');
const { authSchemas } = require('../validations/schemas');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - telefono
 *               - paisOrigen
 *               - password
 *             properties:
 *               cedula: { type: string }
 *               pasaporte: { type: string }
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               telefono: { type: string }
 *               paisOrigen: { type: string }
 *               provincia: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [ADMIN, USER] }
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.post('/register', validate(authSchemas.register, 'body'), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               cedula: { type: string }
 *               pasaporte: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 role: { type: string }
 */
router.post('/login', validate(authSchemas.login, 'body'), authController.login);

module.exports = router;
