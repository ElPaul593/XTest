/**
 * Configuración centralizada de las APIs externas.
 * Antes existían tres variables solapadas (EXTERNAL_SEAT_API, SEAT_API_URL,
 * PRICING_API) y dos proxies que apuntaban a destinos distintos. Aquí se
 * resuelve una única URL base, con compatibilidad hacia atrás con las
 * variables previas para no romper despliegues existentes.
 */
const EXTERNAL_API_URL =
  process.env.EXTERNAL_API_URL ||
  process.env.EXTERNAL_SEAT_API ||
  process.env.PRICING_API ||
  process.env.SEAT_API_URL ||
  'https://apiconsumidorac.onrender.com';

const DEFAULT_REQUEST_TIMEOUT_MS = 4000;

// Precio unitario por defecto (USD) cuando no se puede resolver el precio real de la ruta.
const DEFAULT_PRECIO_UNITARIO_USD = 10;

module.exports = {
  EXTERNAL_API_URL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_PRECIO_UNITARIO_USD
};
