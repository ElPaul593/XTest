const { OAuth2Client } = require('google-auth-library');
const AppError = require('../utils/AppError');

/**
 * Verificación de identidad con Google (Sign in with Google).
 *
 * ## Qué llega y qué se verifica
 *
 * El frontend usa Google Identity Services, que devuelve un **id_token** (un JWT
 * firmado por Google). Aquí se comprueba, contra las claves públicas de Google:
 *
 *   · que la firma es auténtica,
 *   · que no ha caducado,
 *   · que la `audience` es NUESTRO client id (si no, cualquiera podría
 *     reutilizar un token emitido para otra aplicación),
 *   · que el `issuer` es Google.
 *
 * Nunca se confía en los datos que el navegador diga tener: el nombre y el correo
 * se leen del token ya verificado, no del cuerpo de la petición.
 *
 * ## Por qué no basta con el correo
 *
 * Se exige además `email_verified`. Sin esa comprobación, alguien que registrara
 * una cuenta de Google Workspace con un correo ajeno sin verificar podría
 * suplantar a un usuario existente del sistema.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// El cliente se crea una sola vez; `verifyIdToken` cachea las claves públicas
// de Google internamente.
let client = null;
function getClient() {
  if (!client) client = new OAuth2Client(GOOGLE_CLIENT_ID);
  return client;
}

/** Indica si el inicio de sesión con Google está configurado en este despliegue. */
exports.estaConfigurado = () => Boolean(GOOGLE_CLIENT_ID);

exports.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

/**
 * Verifica un id_token de Google y devuelve el perfil ya validado.
 *
 * @param {string} credential El id_token que entrega Google Identity Services.
 * @returns {Promise<{googleId, email, nombre, apellido, avatar}>}
 * @throws {AppError} 503 si no está configurado, 401 si el token no es válido.
 */
exports.verificarIdToken = async (credential) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new AppError(
      'El inicio de sesión con Google no está configurado en el servidor (falta GOOGLE_CLIENT_ID).',
      503
    );
  }

  if (!credential) {
    throw new AppError('Falta el token de Google', 400);
  }

  let payload;
  try {
    const ticket = await getClient().verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    // El detalle real (firma inválida, token caducado, audience incorrecta) se
    // registra, pero al cliente se le da un mensaje genérico.
    console.error('[googleAuthService] id_token rechazado:', error.message);
    throw new AppError('El token de Google no es válido o ha caducado', 401);
  }

  if (!payload || !payload.sub) {
    throw new AppError('El token de Google no contiene un identificador válido', 401);
  }

  if (!payload.email) {
    throw new AppError('La cuenta de Google no expone un correo electrónico', 400);
  }

  if (payload.email_verified === false) {
    throw new AppError(
      'Tu correo de Google no está verificado. Verifícalo antes de usarlo para iniciar sesión.',
      403
    );
  }

  return {
    googleId: String(payload.sub),
    email: String(payload.email).trim().toLowerCase(),
    nombre: payload.given_name || payload.name || '',
    apellido: payload.family_name || '',
    avatar: payload.picture || null
  };
};
