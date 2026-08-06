const PricingStrategySelector = require('../strategies/PricingStrategySelector');
const Ruta = require('../models/rutaModel');
const { buildRouteSchedule } = require('../utils/dateTimeUtils');

/**
 * Servicio de Pricing Reutilizable
 * Calcula precio base, descuentos y total a pagar
 * 
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Encapsula la lógica de cálculo de precios con descuentos
 */

const pricingSelector = new PricingStrategySelector();

/**
 * Calcula el precio con descuentos aplicados
 * @param {string} rutaId - ID de la ruta
 * @param {string} fecha - Fecha del viaje (YYYY-MM-DD)
 * @param {object} options - Opciones adicionales
 * @returns {Promise<object>} Objeto con precioBase, descuento, motivoDescuento, totalPagar
 */
async function calculatePrice(rutaId, fecha, options = {}) {
  // Obtener la ruta para obtener el precio base
  const ruta = await Ruta.findById(rutaId);
  if (!ruta) {
    throw new Error('Ruta no encontrada');
  }

  const precioBase = ruta.price;

  // Determinar contexto para la estrategia de pricing
  const schedule = buildRouteSchedule(ruta, fecha);
  const hoursUntilDeparture = schedule.hoursUntilDeparture;

  // Verificar si es día festivo (simplificado - puedes mejorar esto)
  const isHoliday = options.isHoliday || false;

  // Calcular precio final usando Strategy Pattern
  const precioFinal = pricingSelector.calculatePrice(precioBase, {
    isHoliday,
    hoursUntilDeparture
  });

  // Calcular descuento (negativo) o recargo (positivo)
  const diferencia = precioFinal - precioBase;
  let descuento = 0;
  let recargo = 0;
  if (diferencia < 0) {
    descuento = Math.abs(diferencia);
  } else if (diferencia > 0) {
    recargo = diferencia;
  }

  // Determinar motivo del descuento/recargo
  let motivoDescuento = null;
  let motivoRecargo = null;
  let estrategia = 'standard';
  
  if (isHoliday) {
    motivoRecargo = 'Día festivo (+30%)';
    estrategia = 'holiday';
  } else if (hoursUntilDeparture < 24 && hoursUntilDeparture > 0) {
    motivoRecargo = 'Reserva de última hora (+20%)';
    estrategia = 'lastMinute';
  }

  return {
    precioBase,
    descuento,
    recargo,
    motivoDescuento,
    motivoRecargo,
    totalPagar: precioFinal,
    estrategia
  };
}

module.exports = {
  calculatePrice
};
