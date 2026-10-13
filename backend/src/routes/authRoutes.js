const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validation');
const { authSchemas } = require('../validations/schemas');

/**
 * #15BUG (parte b) — CSP solo para la página de restablecer contraseña.
 *
 * La CSP global está desactivada a propósito porque Swagger UI (`/api-docs`)
 * inyecta scripts y estilos inline y una política estricta rompería la
 * documentación. Pero la página de reseteo es la única HTML propia que sirve el
 * backend y la abre el usuario desde su correo, así que es donde el riesgo era
 * real: aquí sí se aplica, con un nonce por petición para su `<style>` y
 * `<script>` inline.
 */
const cspPaginaReset = [
  (req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  },
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      // La página envía la nueva contraseña por fetch a su propia URL.
      connectSrc: ["'self'"],
      scriptSrc: [(req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: [(req, res) => `'nonce-${res.locals.cspNonce}'`],
      frameAncestors: ["'none'"]
    }
  })
];

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
 *               - email
 *               - telefono
 *               - paisOrigen
 *               - password
 *             properties:
 *               cedula: { type: string }
 *               pasaporte: { type: string }
 *               email: { type: string, format: email }
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               telefono: { type: string }
 *               paisOrigen: { type: string }
 *               provincia: { type: string }
 *               password: { type: string }
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

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Confirmar la dirección de correo (destino del enlace del registro)
 *     description: >
 *       Consume el token (un solo uso) y marca el correo como verificado.
 *       Devuelve una página HTML con el resultado, o JSON con
 *       `Accept: application/json`.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Correo verificado }
 *       400: { description: Token inválido o caducado }
 */
router.get('/verify-email/:token', cspPaginaReset, authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Reenviar el correo de verificación
 *     description: >
 *       Responde siempre lo mismo exista o no la cuenta, para no permitir
 *       enumerar correos registrados. Limitado por `EMAIL_VERIFY_RESEND_SECONDS`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Solicitud registrada }
 *       429: { description: Demasiados reenvíos seguidos }
 */
router.post(
  '/resend-verification',
  validate(authSchemas.forgotPassword, 'body'),
  authController.resendVerification
);

/**
 * @swagger
 * /api/auth/mail-status:
 *   get:
 *     summary: Diagnóstico del envío de correo
 *     description: Qué transportes están disponibles (API consumidora, SMTP, archivo local).
 *     tags: [Auth]
 *     responses:
 *       200: { description: Hay al menos un transporte operativo }
 *       503: { description: Ningún transporte disponible }
 */
router.get('/mail-status', authController.mailStatus);

/**
 * @swagger
 * /api/auth/google/config:
 *   get:
 *     summary: Saber si el acceso con Google está disponible
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Estado y client id público
 */
router.get('/google/config', authController.googleConfig);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Iniciar sesión con Google
 *     description: >
 *       Verifica el `id_token` de Google contra sus claves públicas. Si ya existe
 *       una cuenta con ese correo, la vincula y devuelve `{ token, role }`. Si no
 *       existe, devuelve `{ requiereRegistro: true, perfil }` para que el cliente
 *       complete el registro: el modelo exige cédula o pasaporte y Google no los
 *       proporciona.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential: { type: string, description: "id_token de Google Identity Services" }
 *     responses:
 *       200:
 *         description: Sesión iniciada, o registro pendiente de completar
 *       401:
 *         description: Token de Google inválido o caducado
 *       403:
 *         description: Cuenta bloqueada, o correo de Google sin verificar
 *       410:
 *         description: La cuenta fue dada de baja
 *       503:
 *         description: GOOGLE_CLIENT_ID no está configurado en el servidor
 */
router.post('/google', validate(authSchemas.google, 'body'), authController.googleLogin);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar enlace de recuperación de contraseña
 *     description: >
 *       Genera un token de un solo uso y delega el envío del correo en la API
 *       consumidora. Responde siempre 200 con el mismo mensaje, exista o no una
 *       cuenta con ese correo, para no permitir enumerar usuarios registrados.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Solicitud registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 message: { type: string }
 *       502:
 *         description: El servicio de correo no está disponible
 */
router.post('/forgot-password', validate(authSchemas.forgotPassword, 'body'), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   get:
 *     summary: Abrir el formulario de nueva contraseña (destino del enlace del correo)
 *     description: >
 *       Valida el token en el servidor y devuelve el formulario HTML de cambio de
 *       contraseña. Con `Accept: application/json` devuelve solo el estado del token.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Token válido (HTML con el formulario, o JSON con el estado)
 *       400:
 *         description: Token inválido o caducado
 */
router.get('/reset-password/:token', cspPaginaReset, authController.renderResetPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Guardar la nueva contraseña
 *     description: Consume el token (un solo uso) y reemplaza la contraseña.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Token inválido/caducado o contraseña no válida
 *       403:
 *         description: La cuenta está bloqueada
 *       410:
 *         description: La cuenta fue dada de baja
 */
router.post('/reset-password/:token', validate(authSchemas.resetPassword, 'body'), authController.resetPassword);

module.exports = router;
