import axios from 'axios';

/**
 * Servicio para calcular precios de reservas
 * Usa el proxy local del backend para evitar CORS
 * Endpoint: POST /api/pricing/calcular-precio
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pju6kl-ip-200-50-235-224.tunnelmole.net/api';

/**
 * Obtiene el pricing desde el proxy local del backend
 * @param {number} cantidad - Cantidad de asientos
 * @param {string} rutaId - ID de la ruta (para usar precio local)
 * @returns {Promise<PricingResponse>} Respuesta con pricing
 */
export async function getPricing(cantidad, rutaId = null) {
  if (!cantidad || cantidad <= 0) {
    return {
      ok: false,
      error: 'Cantidad debe ser mayor a 0',
      cantidad: 0,
      precioUnitario: 0,
      subtotal: 0,
      porcentajeDescuento: 0,
      montoDescuento: 0,
      total: 0,
      ahorros: 0
    };
  }

  try {
    console.log(`[PricingService] Llamando con cantidad: ${cantidad}, rutaId: ${rutaId}`);

    // Llamar al proxy - envía rutaId para usar precio de ruta local
    const response = await axios.post(`${API_BASE_URL}/pricing/calcular-precio`, {
      cantidad: Number(cantidad),
      rutaId: rutaId // Para que backend use precio de la ruta
    }, { timeout: 30000 });

    console.log('[PricingService] Pricing response:', response.data);

    return {
      ok: true,
      ...response.data
    };
  } catch (err) {
    console.error('[PricingService] Error calculando precio:', err);
    console.warn('[PricingService] Usando cálculo fallback local');
    return calculatePricingFallback(cantidad);
  }
}

/**
 * Cálculo fallback local cuando el backend no está disponible
 * @param {number} cantidad
 */
function calculatePricingFallback(cantidad) {
  const precioUnitario = 50000;
  const subtotal = cantidad * precioUnitario;

  // Descuentos por cantidad
  let porcentajeDescuento = 0;
  if (cantidad >= 5) {
    porcentajeDescuento = 10;
  } else if (cantidad >= 4) {
    porcentajeDescuento = 10;
  } else if (cantidad >= 3) {
    porcentajeDescuento = 7;
  } else if (cantidad >= 2) {
    porcentajeDescuento = 5;
  }

  const montoDescuento = Math.round(subtotal * (porcentajeDescuento / 100));
  const total = subtotal - montoDescuento;

  return {
    ok: true,
    cantidad,
    precioUnitario,
    subtotal,
    porcentajeDescuento,
    montoDescuento,
    total,
    ahorros: montoDescuento,
    _isFallback: true
  };
}

export default {
  getPricing
};
