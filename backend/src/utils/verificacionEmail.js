/**
 * Reglas de la verificación del correo electrónico.
 *
 * Se aísla aquí porque la decisión «¿esta cuenta cuenta como verificada?» aparece
 * en varios sitios (login, middleware, serializador) y tenerla repetida es la
 * forma más fácil de que acaben discrepando.
 */

/**
 * ¿Hay que exigir el correo verificado para iniciar sesión?
 *
 * Por defecto NO. El registro sí envía el correo y la cuenta nace sin verificar,
 * pero bloquear el acceso desde el primer día dejaría fuera a cualquiera que no
 * reciba el mensaje (filtro de spam, proveedor sin configurar, defensa de la
 * tesis en marcha). Se activa con `REQUIRE_EMAIL_VERIFIED=true` cuando el envío
 * esté funcionando de forma estable.
 *
 * Mientras está desactivado, el estado se sigue registrando y el frontend puede
 * mostrar el aviso de «verifica tu correo», que es el 90 % del valor sin el
 * riesgo de dejar gente fuera.
 */
const EXIGIR_VERIFICACION =
  String(process.env.REQUIRE_EMAIL_VERIFIED || 'false').toLowerCase() === 'true';

/** Validez del enlace de verificación. */
const TTL_MINUTOS = Number(process.env.EMAIL_VERIFY_TTL_MINUTES || 60 * 24);

/** Espera mínima entre reenvíos, para que el endpoint no sirva para hostigar un buzón. */
const REENVIO_MIN_SEGUNDOS = Number(process.env.EMAIL_VERIFY_RESEND_SECONDS || 60);

/**
 * ¿La cuenta tiene el correo verificado?
 *
 * Los usuarios creados antes de existir este campo no lo tienen (`undefined`).
 * Se consideran verificados: no hicieron nada mal y marcarlos como pendientes
 * les mostraría un aviso que no pueden resolver, o les cerraría el acceso si la
 * verificación llega a ser obligatoria.
 *
 * Importante: `false` explícito NO entra aquí. Solo `undefined`/`null`, que es lo
 * que distingue «cuenta anterior a la migración» de «cuenta nueva sin verificar».
 */
function estaVerificado(user) {
  if (!user) return false;
  if (user.emailVerificado === undefined || user.emailVerificado === null) return true;
  return Boolean(user.emailVerificado);
}

/** ¿Debe impedirse el acceso por tener el correo sin verificar? */
function debeBloquearAcceso(user) {
  return EXIGIR_VERIFICACION && !estaVerificado(user);
}

/** Segundos que faltan para poder reenviar, o 0 si ya se puede. */
function segundosParaReenviar(user) {
  if (!user?.emailUltimoEnvio) return 0;
  const transcurridos = (Date.now() - new Date(user.emailUltimoEnvio).getTime()) / 1000;
  return Math.max(0, Math.ceil(REENVIO_MIN_SEGUNDOS - transcurridos));
}

module.exports = {
  EXIGIR_VERIFICACION,
  TTL_MINUTOS,
  REENVIO_MIN_SEGUNDOS,
  estaVerificado,
  debeBloquearAcceso,
  segundosParaReenviar
};
