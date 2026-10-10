const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { serializeUser } = require('../utils/serializers');
const { renderResetForm, renderInvalidToken } = require('../views/resetPasswordPage');
const { FRONTEND_URL } = require('../config/appUrls');

const APP_NAME = process.env.APP_NAME || 'CulturalTrip';

/** El enlace del correo lo abre un navegador; la SPA pide JSON. */
function wantsJson(req) {
  return req.xhr || String(req.get('accept') || '').includes('application/json');
}

exports.register = asyncHandler(async (req, res) => {
  const user = await AuthService.register(req.body);

  res.status(201).json({ 
    data: serializeUser(user)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body);

  // result = { token, role }
  res.json({
    token: result.token,
    role: result.role
  });
});

/**
 * POST /api/auth/google
 * Inicio de sesión con Google.
 *
 * Dos resultados posibles, ambos con 200:
 *   · `{ token, role }`                    → sesión iniciada.
 *   · `{ requiereRegistro: true, perfil }`  → no existe cuenta con ese correo;
 *     el frontend debe abrir el registro con los datos ya rellenados.
 *
 * El segundo caso es 200 y no 404 a propósito: no es un error, es un paso más
 * del flujo, y además un 404 lo trataría el interceptor del frontend como fallo.
 */
exports.googleLogin = asyncHandler(async (req, res) => {
  const resultado = await AuthService.loginConGoogle({ credential: req.body.credential });
  res.json(resultado);
});

/**
 * GET /api/auth/google/config
 * Devuelve el client id público para que el frontend no tenga que duplicarlo en
 * su propio .env, y para poder ocultar el botón si no está configurado.
 *
 * El client id de OAuth es público por diseño (viaja en el HTML de cualquier web
 * que use Google Sign-In). El *client secret* NO se expone aquí ni hace falta:
 * el flujo de id_token no lo utiliza.
 */
exports.googleConfig = asyncHandler(async (req, res) => {
  const GoogleAuthService = require('../services/googleAuthService');
  res.json({
    habilitado: GoogleAuthService.estaConfigurado(),
    clientId: GoogleAuthService.GOOGLE_CLIENT_ID || null
  });
});

/**
 * POST /api/auth/forgot-password
 * Solicita el enlace de recuperación. Responde siempre 200 con el mismo mensaje
 * exista o no el correo, para no revelar qué cuentas están registradas.
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.requestPasswordReset({ email: req.body.email });

  res.json({
    ok: true,
    message: result.message
  });
});

/**
 * GET /api/auth/reset-password/:token
 * Destino del enlace que llega por correo. Valida el token en el servidor y solo
 * entonces renderiza el formulario; si no es válido muestra una página de aviso.
 * Con `Accept: application/json` devuelve el estado del token en lugar del HTML.
 */
exports.renderResetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const estadoToken = await AuthService.validateResetToken(token);

  if (wantsJson(req)) {
    if (!estadoToken.valid) {
      throw new AppError('El enlace de recuperación no es válido o ya caducó. Solicita uno nuevo.', 400);
    }
    return res.json({ ok: true, valid: true, nombre: estadoToken.nombre, expiresAt: estadoToken.expiresAt });
  }

  res.type('html');

  // El nonce lo genera el middleware de CSP de la ruta (ver routes/authRoutes.js).
  const nonce = res.locals.cspNonce;

  if (!estadoToken.valid) {
    return res.status(400).send(renderInvalidToken({
      appName: APP_NAME,
      frontendUrl: FRONTEND_URL,
      nonce
    }));
  }

  return res.send(renderResetForm({
    token,
    nombre: estadoToken.nombre,
    appName: APP_NAME,
    minutosValidez: AuthService.RESET_TOKEN_TTL_MINUTES,
    frontendUrl: FRONTEND_URL,
    nonce
  }));
});

/**
 * POST /api/auth/reset-password/:token
 * Consume el token y guarda la nueva contraseña.
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.resetPassword({
    token: req.params.token,
    password: req.body.password
  });

  res.json({ ok: true, message: result.message });
});
