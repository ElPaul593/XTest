const PricingStrategySelector = require('../strategies/PricingStrategySelector');
const Ruta = require('../models/rutaModel');

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
  const now = new Date();
  const fechaViaje = new Date(fecha);
  
  // Calcular horas hasta la salida (asumiendo que la fecha es la fecha de salida)
  const hoursUntilDeparture = Math.floor((fechaViaje - now) / (1000 * 60 * 60));

  // Verificar si es día festivo (simplificado - puedes mejorar esto)
  const isHoliday = options.isHoliday || false;

  // Calcular precio final usando Strategy Pattern
  const precioFinal = pricingSelector.calculatePrice(precioBase, {
    isHoliday,
    hoursUntilDeparture
  });

  // Calcular descuento (negativo) o recargo (positivo)
  const diferencia = precioFinal - precioBase;
  const descuento = diferencia < 0 ? Math.abs(diferencia) : 0;
  const recargo = diferencia > 0 ? diferencia : 0;

  // Determinar motivo del descuento/recargo
  let motivoDescuento = null;
  let motivoRecargo = null;
  
  if (isHoliday) {
    motivoRecargo = 'Día festivo (+30%)';
  } else if (hoursUntilDeparture < 24 && hoursUntilDeparture > 0) {
    motivoRecargo = 'Reserva de última hora (+20%)';
  }

  return {
    precioBase,
    descuento,
    recargo: recargo || 0,
    motivoDescuento: motivoDescuento || null,
    motivoRecargo: motivoRecargo || null,
    totalPagar: precioFinal,
    estrategia: isHoliday ? 'holiday' : (hoursUntilDeparture < 24 && hoursUntilDeparture > 0 ? 'lastMinute' : 'standard')
  };
}

module.exports = {
  calculatePrice
};
