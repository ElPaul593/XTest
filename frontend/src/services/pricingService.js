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
    return {
      ok: false,
      error: 'No se pudo obtener el precio vigente de la ruta'
    };
  }
}

export default {
  getPricing
};
