const DEFAULT_HORAS_SALIDA = ['07:00', '09:30', '14:00', '18:00'];

function hashString(value) {
  const text = String(value || '').trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = Math.trunc(hash * 31 + (text.codePointAt(index) || 0));
  }

  return Math.abs(hash);
}

function getDeterministicHoraSalida(origen, destino) {
  const index = hashString(`${origen}-${destino}`) % DEFAULT_HORAS_SALIDA.length;
  return DEFAULT_HORAS_SALIDA[index];
}

function parseDurationToMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration / 60;
  }

  const normalized = String(duration || '').trim().toLowerCase();
  if (!normalized) return null;

  const compact = normalized.replaceAll(' ', '');
  let splitAt = -1;

  for (let index = 0; index < compact.length; index += 1) {
    const char = compact[index];
    const isNumeric = char >= '0' && char <= '9';
    const isDecimalSeparator = char === '.' || char === ',';
    if (!isNumeric && !isDecimalSeparator) {
      splitAt = index;
      break;
    }
  }

  if (splitAt <= 0) return null;

  const value = Number(compact.slice(0, splitAt).replace(',', '.'));
  if (Number.isNaN(value)) return null;

  const unit = compact.slice(splitAt);
  if (unit.startsWith('h')) {
    return value * 60;
  }
  if (unit.startsWith('m')) {
    return value;
  }

  return null;
}

function combineDateAndTime(fecha, horaSalida) {
  if (!fecha || !horaSalida) return null;

  const [year, month, day] = String(fecha).split('-').map(Number);
  const [hours, minutes] = String(horaSalida).split(':').map(Number);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function getRouteDurationMinutes(ruta) {
  if (!ruta) return null;

  if (typeof ruta.duracionEstimada === 'number' && Number.isFinite(ruta.duracionEstimada)) {
    return ruta.duracionEstimada / 60;
  }

  const fromDuration = parseDurationToMinutes(ruta.duration);
  return fromDuration;
}

function buildRouteSchedule(ruta, fechaViaje) {
  const departureDate = combineDateAndTime(fechaViaje, ruta?.horaSalida || '08:00');
  if (!departureDate) {
    return {
      departureDate: null,
      arrivalDate: null,
      durationMinutes: null,
      hoursUntilDeparture: null,
      hoursUntilArrival: null
    };
  }

  const durationMinutes = getRouteDurationMinutes(ruta);
  const arrivalDate = durationMinutes != null
    ? new Date(departureDate.getTime() + durationMinutes * 60 * 1000)
    : null;

  const now = new Date();
  const hoursUntilDeparture = Math.floor((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const hoursUntilArrival = arrivalDate
    ? Math.floor((arrivalDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    : null;

  return {
    departureDate,
    arrivalDate,
    durationMinutes,
    hoursUntilDeparture,
    hoursUntilArrival
  };
}

module.exports = {
  getDeterministicHoraSalida,
  parseDurationToMinutes,
  combineDateAndTime,
  getRouteDurationMinutes,
  buildRouteSchedule
};