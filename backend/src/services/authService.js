const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
// `crypto` ya se importa arriba: ambas ramas lo añadieron por su cuenta y el
// merge dejó la línea duplicada.
const AccountRecovery = require('../models/accountRecoveryModel');
const RecoveryEmailService = require('./accountRecoveryEmailService');
const AppError = require('../utils/AppError');
const { validarCedulaEcuatoriana } = require('../utils/cedulaValidator');
const { getProvinciaFromCedula } = require('../utils/provinciaUtils');
const { assertCuentaOperativa, getEstado, ESTADOS } = require('../utils/estadoCuenta');
const { buildResetPasswordUrl, buildVerifyEmailUrl } = require('../config/appUrls');
const MailerService = require('./mailerService');
const GoogleAuthService = require('./googleAuthService');
const VerificacionEmail = require('../utils/verificacionEmail');

const PREFERENCIAS_VALIDAS = new Set(['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro']);

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio especializado en autenticación, registro y emisión de tokens.
 * La creación de usuarios queda centralizada en createUserAccount, usada tanto
 * por el registro público como por la creación administrativa de usuarios.
 * Los errores se lanzan como AppError (operacionales) para que el errorHandler
 * responda con el status y mensaje correctos (en vez de un 500 genérico).
 */

const SALT_ROUNDS = 10;

// Ventana de validez del enlace de recuperación de contraseña.
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

/**
 * El token viaja en claro en el enlace del correo, pero en la BD solo se guarda
 * su hash. Así, leer la colección no basta para secuestrar un reseteo en curso.
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function validateCedula(cedula) {
  return /^\d{1,10}$/.test(cedula);
}

function normalizePreferencias(preferencias) {
  if (!Array.isArray(preferencias)) {
    return [];
  }

  return [...new Set(preferencias.map((preferencia) => String(preferencia).trim()).filter((preferencia) => PREFERENCIAS_VALIDAS.has(preferencia)))];
}

async function createNationalUser({ cedulaLimpia, nombre, apellido, telefonoLimpio, emailLimpio, password, paisSeleccionado, provincia, preferenciasLimpias, assignedRole }) {
  const existing = await User.findOne({ cedula: cedulaLimpia });
  if (existing) throw new AppError('Usuario con esa cédula ya existe', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    cedula: cedulaLimpia,
    nombre,
    apellido,
    telefono: telefonoLimpio,
    email: emailLimpio,
    password: hashed,
    paisOrigen: paisSeleccionado || 'Ecuador',
    provincia: provincia || getProvinciaFromCedula(cedulaLimpia),
    preferencias: preferenciasLimpias,
    role: assignedRole
  });
  return user.save();
}

async function createForeignUser({ pasaporteLimpio, nombre, apellido, telefonoLimpio, emailLimpio, password, paisSeleccionado, preferenciasLimpias, assignedRole }) {
  const existing = await User.findOne({ pasaporte: pasaporteLimpio });
  if (existing) throw new AppError('Usuario con ese pasaporte ya existe', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    pasaporte: pasaporteLimpio,
    nombre,
    apellido,
    telefono: telefonoLimpio,
    email: emailLimpio,
    password: hashed,
    paisOrigen: paisSeleccionado,
    preferencias: preferenciasLimpias,
    role: assignedRole
  });
  return user.save();
}

/**
 * Crea una cuenta de usuario aplicando todas las reglas de negocio
 * (validación de cédula/pasaporte, normalización, hash y detección de provincia).
 * Es la ÚNICA puerta de creación de usuarios para evitar caminos divergentes.
 *
 * @param {object} data
 * @param {string} [data.role] - 'USER' por defecto; 'ADMIN' solo si el llamador lo permite.
 */
exports.createUserAccount = async ({ cedula, pasaporte, email, nombre, apellido, telefono, password, paisOrigen, provincia, preferencias = [], role = 'USER' }) => {
  if (!nombre || !apellido || !telefono || !password || !email) {
    throw new AppError('Todos los campos son requeridos', 400);
  }

  const emailLimpio = String(email).trim().toLowerCase();
  const existingEmail = await User.findOne({ email: emailLimpio });
  if (existingEmail) {
    throw new AppError('Usuario con ese correo ya existe', 409);
  }

  const telefonoLimpio = String(telefono).replace(/\D/g, '').slice(0, 15);
  if (telefonoLimpio.length < 10) {
    throw new AppError('El teléfono debe tener al menos 10 dígitos', 400);
  }

  const preferenciasLimpias = normalizePreferencias(preferencias);

  const normalizedRole = String(role || 'USER').toUpperCase();
  const assignedRole = ['ADMIN', 'AGENTE', 'USER'].includes(normalizedRole) ? normalizedRole : 'USER';
  const paisSeleccionado = paisOrigen ? String(paisOrigen).trim() : '';
  const pasaporteLimpio = pasaporte ? String(pasaporte).trim() : '';

  // Camino nacional: usa cédula ecuatoriana
  if (cedula || paisSeleccionado === 'Ecuador') {
    if (!cedula) throw new AppError('La cédula es requerida para usuarios nacionales', 400);
    if (!validateCedula(cedula)) throw new AppError('Cédula debe contener hasta 10 dígitos numéricos', 400);

    const cedulaLimpia = String(cedula).replace(/\D/g, '').slice(0, 10);
    if (cedulaLimpia.length !== 10) {
      throw new AppError('La cédula ecuatoriana debe tener exactamente 10 dígitos', 400);
    }
    if (!validarCedulaEcuatoriana(cedulaLimpia)) {
      throw new AppError('La cédula ecuatoriana no es válida.', 400);
    }

    return createNationalUser({
      cedulaLimpia,
      nombre,
      apellido,
      telefonoLimpio,
      emailLimpio,
      password,
      paisSeleccionado,
      provincia,
      preferenciasLimpias,
      assignedRole
    });
  }

  // Camino extranjero: usa pasaporte
  if (!pasaporte) throw new AppError('El pasaporte es requerido para usuarios extranjeros', 400);
  if (!paisSeleccionado) throw new AppError('El país de origen es requerido', 400);

  if (pasaporteLimpio.length < 6 || pasaporteLimpio.length > 20) {
    throw new AppError('El pasaporte debe tener entre 6 y 20 caracteres', 400);
  }

  return createForeignUser({
    pasaporteLimpio,
    nombre,
    apellido,
    telefonoLimpio,
    emailLimpio,
    password,
    paisSeleccionado,
    preferenciasLimpias,
    assignedRole
  });
};

/**
 * Registro público: SIEMPRE crea con rol USER (no permite escalada de privilegios).
 *
 * Tras crear la cuenta se inicia el envío del correo de verificación sin
 * bloquear la respuesta HTTP. El envío se hace "best effort": si falla, el
 * registro NO se deshace y el usuario puede pedir el reenvío desde el login.
 *
 * Esto es importante en producción: un proveedor de correo puede tardar más que
 * el timeout del navegador aunque la cuenta ya se haya guardado correctamente.
 */
exports.register = async (data) => {
  const user = await exports.createUserAccount({ ...data, role: 'USER' });

  // No esperar al proveedor externo: el registro debe confirmar la creación
  // aunque el correo tarde o falle. La promesa siempre tiene un rechazo tratado.
  void exports.enviarVerificacionEmail(user).catch((error) => {
    console.error(`[authService] Registro OK pero no se pudo enviar la verificación a ${user.email}:`, error.message);
  });

  return user;
};

// ---------------------------------------------------------------------------
// Verificación del correo electrónico
// ---------------------------------------------------------------------------

/** El token viaja en el enlace; en la BD solo se guarda su hash. */
function hashEmailToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * Genera un token de verificación, lo guarda hasheado y envía el correo.
 *
 * @param {object} user Documento Mongoose del usuario.
 * @returns {Promise<{ok:boolean, via?:string}>}
 */
exports.enviarVerificacionEmail = async (user) => {
  if (!user?.email) {
    throw new AppError('El usuario no tiene correo electrónico', 400);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailTokenHash: hashEmailToken(rawToken),
        emailTokenExpires: new Date(Date.now() + VerificacionEmail.TTL_MINUTOS * 60 * 1000),
        emailUltimoEnvio: new Date()
      }
    }
  );

  const verifyUrl = buildVerifyEmailUrl(rawToken);

  const { subject, html, text } = MailerService.construirCorreoVerificacion({
    nombre: user.nombre,
    verifyUrl,
    horasValidez: Math.round(VerificacionEmail.TTL_MINUTOS / 60)
  });

  const envio = await MailerService.enviarCorreo({
    to: user.email,
    subject,
    html,
    text,
    meta: { tipo: 'verificar-email', usuarioId: String(user._id) }
  });

  if (!envio.ok) {
    // El token queda guardado a propósito: si el fallo fue del transporte, un
    // reenvío posterior generará otro y el usuario no se queda atrapado.
    throw new AppError('No se pudo enviar el correo de verificación', 502);
  }

  return { ok: true, via: envio.via };
};

/**
 * Consume el token y marca el correo como verificado.
 * El token sirve una sola vez.
 */
exports.verificarEmail = async (token) => {
  if (!token) throw new AppError('Falta el token de verificación', 400);

  const user = await User.findOne({
    emailTokenHash: hashEmailToken(token),
    emailTokenExpires: { $gt: new Date() }
  }).select('+emailTokenHash +emailTokenExpires');

  if (!user) {
    // Puede ser un token caducado, ya usado o inventado. No se distingue: decirlo
    // permitiría averiguar qué tokens existieron.
    return { ok: false, motivo: 'INVALIDO' };
  }

  // Si la cuenta se bloqueó o se dio de baja entre el envío y el clic, verificar
  // el correo no debe revivirla.
  assertCuentaOperativa(user);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { emailVerificado: true, emailVerificadoEn: new Date() },
      $unset: { emailTokenHash: '', emailTokenExpires: '' }
    }
  );

  return { ok: true, nombre: user.nombre, email: user.email };
};

/**
 * Reenvía el correo de verificación.
 *
 * Responde siempre igual exista o no la cuenta, por el mismo motivo que
 * `requestPasswordReset`: si distinguiera, serviría para enumerar correos
 * registrados.
 */
exports.reenviarVerificacionEmail = async ({ email }) => {
  const respuestaNeutra = {
    ok: true,
    message: 'Si el correo corresponde a una cuenta pendiente de verificar, te hemos enviado un enlace nuevo.'
  };

  if (!email) throw new AppError('El correo es requerido', 400);

  const emailLimpio = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: emailLimpio }).select('+emailUltimoEnvio');

  if (!user) return respuestaNeutra;
  if (VerificacionEmail.estaVerificado(user)) return respuestaNeutra;
  if (getEstado(user) !== ESTADOS.ACTIVO) return respuestaNeutra;

  const espera = VerificacionEmail.segundosParaReenviar(user);
  if (espera > 0) {
    throw new AppError(`Espera ${espera} segundos antes de pedir otro correo`, 429);
  }

  await exports.enviarVerificacionEmail(user);
  return respuestaNeutra;
};

/**
 * Login: valida credenciales y emite el JWT.
 */
exports.login = async ({ cedula, pasaporte, password }) => {
  if (!password) throw new AppError('Contraseña es requerida', 400);
  if (!cedula && !pasaporte) throw new AppError('Cédula o pasaporte es requerido', 400);

  let user;
  if (cedula) {
    const cedulaLimpia = String(cedula).replace(/\D/g, '');
    user = await User.findOne({ cedula: cedulaLimpia });
  } else {
    const pasaporteLimpio = String(pasaporte).trim();
    user = await User.findOne({ pasaporte: pasaporteLimpio });
  }
  if (!user) throw new AppError('Usuario o contraseña inválidos', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError('Usuario o contraseña inválidos', 401);

  // El estado se comprueba DESPUÉS de validar la contraseña a propósito: si se
  // comprobara antes, cualquiera podría averiguar si una cédula corresponde a una
  // cuenta bloqueada o dada de baja sin conocer las credenciales.
  assertCuentaOperativa(user);

  // Correo sin verificar. Solo bloquea si REQUIRE_EMAIL_VERIFIED=true; mientras
  // esté desactivado se deja entrar y el frontend muestra el aviso, para no dejar
  // fuera a quien no recibió el correo (spam, proveedor sin configurar).
  if (VerificacionEmail.debeBloquearAcceso(user)) {
    const error = new AppError(
      'Tienes que confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o pide un enlace nuevo.',
      403
    );
    error.codigoEstado = 'EMAIL_NO_VERIFICADO';
    throw error;
  }

  const roleNormalized = String(user.role || 'user').toLowerCase();
  const payload = {
    id: user._id,
    role: roleNormalized,
    cedula: user.cedula || null,
    pasaporte: user.pasaporte || null
  };

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurado en el servidor', 500);
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  // `emailVerificado` viaja en la respuesta para que el frontend pueda mostrar el
  // aviso de «confirma tu correo» sin tener que pedir el perfil aparte.
  return {
    token,
    role: roleNormalized,
    emailVerificado: VerificacionEmail.estaVerificado(user),
    email: user.email || null
  };
};

/**
 * Paso 1 del reseteo: el usuario pide el enlace indicando su correo.
 *
 * Responde siempre lo mismo haya o no una cuenta con ese correo. Si distinguiera
 * ambos casos, el endpoint se convertiría en un oráculo para enumerar los correos
 * registrados en el sistema.
 *
 * El correo NO se envía por SMTP desde aquí: se delega en la API consumidora
 * (ver services/mailerService.js).
 */
/**
 * Enmascara un correo para poder decirle al usuario A DÓNDE se envió el enlace
 * sin revelar la dirección completa.
 *
 *   pablo.escobar@gmail.com  ->  pa**********@g****.com
 *
 * Hace falta cuando alguien pide la recuperación con su cédula precisamente
 * porque no recuerda qué correo usó: sin esta pista tendría que adivinar en qué
 * bandeja mirar.
 *
 * El compromiso, consciente: devolver la pista solo cuando la cuenta existe
 * permite deducir que una cédula está registrada. Se acepta porque sin ella la
 * función no sirve para su propósito, y porque se enmascara lo suficiente para
 * que no identifique a nadie que no reconozca ya su propia dirección. Si se
 * prefiere neutralidad total, basta con dejar de incluir `destinoEnmascarado` en
 * la respuesta: el resto del flujo no depende de él.
 */
function enmascararEmail(email) {
  const texto = String(email || '');
  const [usuario, dominio] = texto.split('@');
  if (!usuario || !dominio) return null;

  const visible = usuario.slice(0, Math.min(2, usuario.length));
  const usuarioOculto = visible + '*'.repeat(Math.max(1, usuario.length - visible.length));

  const partes = dominio.split('.');
  const tld = partes.length > 1 ? partes.pop() : '';
  const nombreDominio = partes.join('.');
  const dominioOculto = nombreDominio.slice(0, 1) + '*'.repeat(Math.max(1, nombreDominio.length - 1));

  return `${usuarioOculto}@${dominioOculto}${tld ? '.' + tld : ''}`;
}

/**
 * @param {object} datos
 * @param {string} [datos.email]      Correo de la cuenta.
 * @param {string} [datos.cedula]     Alternativa si no recuerda el correo.
 * @param {string} [datos.pasaporte]  Alternativa para usuarios extranjeros.
 */
exports.requestPasswordReset = async ({ email, cedula, pasaporte }) => {
  const respuestaNeutra = {
    ok: true,
    message: 'Si los datos corresponden a una cuenta registrada, recibirás un enlace para restablecer tu contraseña.'
  };

  // Se busca por el identificador que haya llegado. Permitir cédula o pasaporte
  // es lo que da salida a quien no recuerda con qué correo se registró.
  let filtro = null;
  if (email) {
    filtro = { email: String(email).trim().toLowerCase() };
  } else if (cedula) {
    filtro = { cedula: String(cedula).replace(/\D/g, '') };
  } else if (pasaporte) {
    filtro = { pasaporte: String(pasaporte).trim() };
  }

  if (!filtro) {
    throw new AppError('Indica tu correo, tu cédula o tu pasaporte', 400);
  }

  const user = await User.findOne(filtro);

  if (!user) {
    return respuestaNeutra;
  }

  // Sin correo guardado no hay a dónde enviar el enlace. Pasa con cuentas
  // antiguas creadas antes de que el correo fuera obligatorio.
  if (!user.email) {
    console.warn(`[authService] Reseteo solicitado para una cuenta sin correo: ${user._id}`);
    return respuestaNeutra;
  }

  // Una cuenta bloqueada o dada de baja no puede recuperar su acceso por sí sola:
  // reactivarla es una decisión administrativa, no un cambio de contraseña.
  if (getEstado(user) !== ESTADOS.ACTIVO) {
    console.warn(`[authService] Reseteo solicitado para una cuenta en estado ${getEstado(user)}: ${user.email}`);
    return respuestaNeutra;
  }

  // Token en claro para el enlace; en la BD solo queda su hash.
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashResetToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  // Enlace dinámico construido con el token recién generado.
  const resetUrl = buildResetPasswordUrl(rawToken);

  const { subject, html, text } = MailerService.construirCorreoResetPassword({
    nombre: user.nombre,
    resetUrl,
    minutosValidez: RESET_TOKEN_TTL_MINUTES
  });

  const envio = await MailerService.enviarCorreo({
    to: user.email,
    subject,
    html,
    text,
    meta: { tipo: 'reset-password', usuarioId: String(user._id) }
  });

  if (!envio.ok) {
    // Si el correo no salió, el token guardado no le sirve a nadie: se limpia
    // para que un reintento genere uno nuevo en lugar de dejar basura vigente.
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    throw new AppError(
      'No se pudo enviar el correo de recuperación en este momento. Inténtalo de nuevo en unos minutos.',
      502
    );
  }

  // La pista del destino solo se añade cuando el usuario NO escribió el correo:
  // si lo escribió él, ya sabe dónde mirar y repetírselo no aporta nada.
  if (!email) {
    return {
      ...respuestaNeutra,
      message: `Hemos enviado el enlace a ${enmascararEmail(user.email)}. Revisa esa bandeja de entrada y la carpeta de spam.`,
      destinoEnmascarado: enmascararEmail(user.email)
    };
  }

  return respuestaNeutra;
};

/**
 * Busca el usuario dueño de un token de reseteo vigente.
 * @returns {Promise<object|null>} documento Mongoose, o null si no existe o caducó.
 */
async function findUserByResetToken(token) {
  if (!token) return null;

  return User.findOne({
    resetPasswordTokenHash: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordTokenHash +resetPasswordExpires');
}

/**
 * Comprueba si un token de reseteo sigue siendo válido, sin consumirlo.
 * Lo usa el backend antes de mostrar el formulario de nueva contraseña.
 */
exports.validateResetToken = async (token) => {
  const user = await findUserByResetToken(token);
  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    nombre: user.nombre,
    email: user.email,
    expiresAt: user.resetPasswordExpires
  };
};

/**
 * Paso 2 del reseteo: el usuario envía la nueva contraseña junto con el token.
 * El token se invalida al usarse (un enlace, un solo cambio).
 */
exports.resetPassword = async ({ token, password }) => {
  if (!token) throw new AppError('El token de recuperación es requerido', 400);
  if (!password || String(password).length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    throw new AppError('El enlace de recuperación no es válido o ya caducó. Solicita uno nuevo.', 400);
  }

  // El estado pudo cambiar entre la solicitud y el uso del enlace.
  assertCuentaOperativa(user);

  const mismaPassword = await bcrypt.compare(String(password), user.password);
  if (mismaPassword) {
    throw new AppError('La nueva contraseña debe ser distinta de la actual', 400);
  }

  user.password = await bcrypt.hash(String(password), SALT_ROUNDS);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { ok: true, message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
};

exports.RESET_TOKEN_TTL_MINUTES = RESET_TOKEN_TTL_MINUTES;

/**
 * Emite el JWT de sesión para un usuario ya autenticado por cualquier vía.
 * Extraído de `login` para que el acceso con Google produzca exactamente el
 * mismo token y no haya dos formas distintas de representar una sesión.
 */
function emitirToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurado en el servidor', 500);
  }

  const roleNormalized = String(user.role || 'user').toLowerCase();

  const token = jwt.sign(
    {
      id: user._id,
      role: roleNormalized,
      cedula: user.cedula || null,
      pasaporte: user.pasaporte || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, role: roleNormalized };
}

/**
 * Inicio de sesión con Google.
 *
 * ## El problema de diseño que resuelve
 *
 * El modelo `User` exige cédula O pasaporte, y Google no entrega ninguno de los
 * dos. Validar la cédula ecuatoriana es una regla central del sistema, así que no
 * se relaja: en su lugar el flujo se parte en dos casos.
 *
 *   a) Ya existe una cuenta con ese correo  → se vincula el `googleId` y se
 *      inicia sesión. El usuario no tiene que volver a escribir su cédula.
 *
 *   b) No existe ninguna cuenta con ese correo → NO se crea nada a medias.
 *      Se devuelve `requiereRegistro: true` junto con el perfil verificado, para
 *      que el frontend muestre el registro con nombre y correo ya rellenados y
 *      solo pida lo que Google no puede dar: cédula o pasaporte, teléfono y país.
 *
 * Crear el usuario en el caso (b) con una cédula inventada habría metido datos
 * inválidos en la base y roto la validación en la que se apoya todo el registro.
 *
 * @returns {Promise<{token,role}|{requiereRegistro:true,perfil:object}>}
 */
exports.loginConGoogle = async ({ credential }) => {
  const perfil = await GoogleAuthService.verificarIdToken(credential);

  // Se busca primero por googleId (estable aunque cambie el correo) y después
  // por correo, que es lo que permite vincular una cuenta ya existente.
  let user = await User.findOne({ googleId: perfil.googleId });

  if (!user) {
    user = await User.findOne({ email: perfil.email });
  }

  if (!user) {
    return {
      requiereRegistro: true,
      perfil: {
        email: perfil.email,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        avatar: perfil.avatar
      },
      message: 'No hay ninguna cuenta con ese correo. Completa el registro para crearla.'
    };
  }

  // Estado de la cuenta: un bloqueo debe impedir también la entrada por Google.
  // Sin esta comprobación, Google sería una puerta trasera al bloqueo.
  assertCuentaOperativa(user);

  // Vinculación en el primer acceso, y actualización del avatar.
  const cambios = {};
  if (!user.googleId) cambios.googleId = perfil.googleId;
  if (perfil.avatar && user.googleAvatar !== perfil.avatar) cambios.googleAvatar = perfil.avatar;

  if (Object.keys(cambios).length > 0) {
    // `updateOne` en vez de `save()` para no disparar la validación del documento
    // completo: los usuarios antiguos podrían no cumplir reglas añadidas después,
    // y eso no debe impedirles entrar.
    await User.updateOne({ _id: user._id }, { $set: cambios });
  }

  return emitirToken(user);
};

const GENERIC_RECOVERY_MESSAGE = 'Si los datos coinciden con una cuenta recuperable, recibirás instrucciones en el correo registrado.';
const RECOVERY_TTL_MS = 10 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

exports.requestRecovery = async ({ cedula, pasaporte, email, purpose = 'account' }) => {
  const identifier = cedula
    ? { cedula: String(cedula).replace(/\D/g, '') }
    : { pasaporte: String(pasaporte).trim() };
  /**
   * ADAPTADO AL MODELO DE `estado` AL FUSIONAR RAMAS.
   *
   * La consulta original filtraba por `isDeleted: purpose === 'account'`. Ese
   * campo desapareció al unificar las bajas en `estado`
   * (ACTIVO / BLOQUEADO / ELIMINADO), así que se traduce:
   *
   *   purpose 'account'  → la cuenta NO está activa (bloqueada o dada de baja).
   *                        Son las que tiene sentido «recuperar».
   *   purpose 'password'  → la cuenta sí está activa; aquí solo se cambia la
   *                        contraseña. Se acepta `estado` ausente para no dejar
   *                        fuera a los usuarios anteriores a la migración.
   */
  const filtroEstado = purpose === 'account'
    ? { estado: { $in: [ESTADOS.BLOQUEADO, ESTADOS.ELIMINADO] } }
    : { estado: { $in: [ESTADOS.ACTIVO, null] } };

  const user = await User.findOne({
    ...identifier,
    email: String(email).trim().toLowerCase(),
    ...filtroEstado
  });

  if (!user) return { message: GENERIC_RECOVERY_MESSAGE };

  await AccountRecovery.updateMany(
    { user: user._id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } }
  );

  const code = String(crypto.randomInt(100000, 1000000));
  const recovery = await AccountRecovery.create({
    user: user._id,
    codeHash: hashRecoveryCode(code),
    purpose,
    expiresAt: new Date(Date.now() + RECOVERY_TTL_MS)
  });

  await RecoveryEmailService.sendCode(user.email, code);
  return { message: GENERIC_RECOVERY_MESSAGE, recoveryId: recovery._id.toString() };
};

exports.confirmRecovery = async ({ recoveryId, code, password }) => {
  const recovery = await AccountRecovery.findOne({
    _id: recoveryId,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!recovery || recovery.attempts >= MAX_RECOVERY_ATTEMPTS) {
    throw new AppError('Código inválido o expirado', 400);
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(recovery.codeHash),
    Buffer.from(hashRecoveryCode(code))
  );

  if (!valid) {
    recovery.attempts += 1;
    await recovery.save();
    throw new AppError('Código inválido o expirado', 400);
  }

  const isAccountRecovery = recovery.purpose !== 'password';
  const hash = await bcrypt.hash(password, 10);

  // Mismo cambio que en `requestRecovery`: `isDeleted` se traduce a `estado`.
  // Recuperar la cuenta la devuelve a ACTIVO y limpia el motivo del bloqueo, que
  // ya no describe la situación.
  const user = await User.findOneAndUpdate(
    isAccountRecovery
      ? { _id: recovery.user, estado: { $in: [ESTADOS.BLOQUEADO, ESTADOS.ELIMINADO] } }
      : { _id: recovery.user },
    isAccountRecovery
      ? {
          $set: {
            password: hash,
            estado: ESTADOS.ACTIVO,
            estadoMotivo: null,
            estadoCambiadoEn: new Date()
          }
        }
      : { $set: { password: hash } },
    { new: true }
  );

  if (!user) throw new AppError('Código inválido o expirado', 400);

  recovery.usedAt = new Date();
  await recovery.save();
  return { message: 'Cuenta recuperada exitosamente' };
};
