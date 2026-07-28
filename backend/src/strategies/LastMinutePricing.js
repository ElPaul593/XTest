const PricingStrategy = require('./PricingStrategy');

/**
 * Estrategia de pricing para última hora
 * Incrementa el precio en un 20% si es reserva de última hora
 */
class LastMinutePricing extends PricingStrategy {
  calculatePrice(basePrice, context = {}) {
    const hoursUntilDeparture = context.hoursUntilDeparture || 0;
    
    // Si faltan menos de 24 horas para la salida, aplicar descuento de última hora
    if (hoursUntilDeparture < 24 && hoursUntilDeparture > 0) {
      return Math.round(basePrice * 1.2);
    }
    
    return basePrice;
  }
}

module.exports = LastMinutePricing;

