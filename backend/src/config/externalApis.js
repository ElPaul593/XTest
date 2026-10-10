/**
 * Configuración centralizada de la API externa de asientos y precios
 * (el proyecto `apiconsumidorac/seat-api`).
 *
 * ## Por qué este archivo exporta rutas y no solo una URL base
 *
 * Antes exportaba únicamente `EXTERNAL_API_URL` y cada consumidor concatenaba el
 * resto del camino a mano. Eso provocó un fallo silencioso grave:
 * `routes/asientosRoutes.js` pedía `{base}/view-model` cuando la API expone
 * `{base}/api/asientos/view-model`. Todas esas llamadas devolvían **404**, el
 * `catch` lo capturaba y el backend respondía siempre con su fallback local de
 * Mongo. Resultado: la API externa no se consumía nunca por esa vía y nadie se
 * enteraba, porque la respuesta del fallback es válida.
 *
 * Verificado contra la API en local (puerto 5008):
 *
 *   GET /view-model                     -> 404
 *   GET /api/asientos/view-model        -> 200
 *   POST /api/asientos/calcular-precio  -> 404
 *   POST /calcular-precio               -> 200   ← ojo: cuelga de la raíz
 *
 * Los caminos se centralizan aquí para que un cambio en la API externa se toque
 * en un solo sitio y no haya que adivinar el prefijo en cada llamada.
 */

// Base del servicio. En desarrollo conviene apuntar a la API local
// (`http://localhost:5008`) para trabajar contra la versión en curso sin
// desplegar: basta definir EXTERNAL_API_URL en backend/.env
const EXTERNAL_API_URL = (
  process.env.EXTERNAL_API_URL ||
  process.env.EXTERNAL_SEAT_API ||
  process.env.PRICING_API ||
  process.env.SEAT_API_URL ||
  'https://apiconsumidorac.onrender.com'
).replace(/\/+$/, '');

/**
 * Caminos exactos de la API externa, verificados contra la versión viva.
 *
 * `asientos` cuelga de `/api/asientos`; `calcularPrecio` cuelga de la RAÍZ.
 * La asimetría es de la API externa, no un error de transcripción.
 */
const SEAT_API_PATHS = Object.freeze({
  viewModel: '/api/asientos/view-model',
  disponibles: '/api/asientos/disponibles',
  reservar: '/api/asientos/reservar',
  holds: '/api/asientos/holds',
  liberarHold: '/api/asientos/holds/liberar',
  reservarDefinitivo: '/api/asientos/reservar-definitivo',
  calcularPrecio: '/calcular-precio',
  health: '/health'
});

/** Construye una URL absoluta a partir de una clave de SEAT_API_PATHS. */
function seatApiUrl(clave) {
  const path = SEAT_API_PATHS[clave];
  if (!path) {
    throw new Error(`Ruta desconocida de la API de asientos: "${clave}"`);
  }
  return `${EXTERNAL_API_URL}${path}`;
}

const DEFAULT_REQUEST_TIMEOUT_MS = Number(process.env.SEAT_API_TIMEOUT_MS || 4000);

/**
 * Precio unitario de respaldo, SOLO para cuando la API externa no responde.
 *
 * La API externa cotiza en COP (50 000 por asiento) y devuelve además el cobro
 * equivalente en USD. Este valor es el del catálogo local de rutas
 * (`Ruta.price`, en USD), que es lo que se usa cuando no hay API.
 */
const DEFAULT_PRECIO_UNITARIO_USD = Number(process.env.DEFAULT_PRECIO_UNITARIO_USD || 10);

// Respaldos del mapa de asientos. Se usan solo si la API externa no responde:
// cuando sí responde, el total y el TTL se toman de ella (`totalAsientos`, `ttlMs`).
const FALLBACK_TOTAL_ASIENTOS = Number(process.env.FALLBACK_TOTAL_ASIENTOS || 40);
const FALLBACK_HOLD_TTL_MS = Number(process.env.FALLBACK_HOLD_TTL_MS || 10 * 60 * 1000);

module.exports = {
  EXTERNAL_API_URL,
  SEAT_API_PATHS,
  seatApiUrl,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_PRECIO_UNITARIO_USD,
  FALLBACK_TOTAL_ASIENTOS,
  FALLBACK_HOLD_TTL_MS
};
