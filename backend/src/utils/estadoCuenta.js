const AppError = require('./AppError');

/**
 * Estado de la cuenta: fuente única de verdad para el ciclo de vida del usuario.
 *
 * La baja de una cuenta NUNCA borra el documento. Si se borrara, las reservas,
 * boletos y calificaciones que apuntan a ese usuario quedarían huérfanas y se
 * perdería la trazabilidad histórica del sistema. En su lugar se marca el estado
 * y el resto del código decide qué puede hacer esa cuenta.
 */
const ESTADOS = Object.freeze({
  ACTIVO: 'ACTIVO',
  BLOQUEADO: 'BLOQUEADO',
  ELIMINADO: 'ELIMINADO'
});

const ESTADOS_VALIDOS = Object.freeze(Object.values(ESTADOS));

/**
 * Normaliza el estado de un usuario.
 * Los documentos anteriores a la migración no tienen el campo `estado`: se
 * consideran ACTIVO para no dejar fuera a los usuarios ya registrados.
 */
function getEstado(user) {
  if (!user) return ESTADOS.ACTIVO;
  const raw = String(user.estado || '').toUpperCase();
  return ESTADOS_VALIDOS.includes(raw) ? raw : ESTADOS.ACTIVO;
}

function isActivo(user) {
  return getEstado(user) === ESTADOS.ACTIVO;
}

function isBloqueado(user) {
  return getEstado(user) === ESTADOS.BLOQUEADO;
}

function isEliminado(user) {
  return getEstado(user) === ESTADOS.ELIMINADO;
}

/**
 * Traduce el estado de la cuenta al error HTTP que corresponde.
 *
 * Se diferencia a propósito entre bloqueada y eliminada porque son situaciones
 * distintas para el usuario: una se resuelve contactando al administrador y la
 * otra la provocó él mismo al darse de baja.
 *
 * @returns {AppError|null} null si la cuenta puede operar con normalidad.
 */
function buildEstadoError(user) {
  const estado = getEstado(user);

  if (estado === ESTADOS.BLOQUEADO) {
    const motivo = user?.estadoMotivo
      ? ` Motivo: ${user.estadoMotivo}`
      : '';
    const error = new AppError(
      `Tu cuenta está bloqueada y no puede iniciar sesión.${motivo} Contacta con el administrador para reactivarla.`,
      403
    );
    error.codigoEstado = ESTADOS.BLOQUEADO;
    return error;
  }

  if (estado === ESTADOS.ELIMINADO) {
    const error = new AppError(
      'Esta cuenta fue dada de baja. Si necesitas recuperarla, contacta con el administrador.',
      410
    );
    error.codigoEstado = ESTADOS.ELIMINADO;
    return error;
  }

  return null;
}

/**
 * Lanza el error correspondiente si la cuenta no está activa.
 * Pensado para usarse en login y en la verificación del token.
 */
function assertCuentaOperativa(user) {
  const error = buildEstadoError(user);
  if (error) throw error;
}

module.exports = {
  ESTADOS,
  ESTADOS_VALIDOS,
  getEstado,
  isActivo,
  isBloqueado,
  isEliminado,
  buildEstadoError,
  assertCuentaOperativa
};
