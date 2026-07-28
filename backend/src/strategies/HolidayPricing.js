const PricingStrategy = require('./PricingStrategy');

/**
 * Estrategia de pricing para días festivos
 * Incrementa el precio en un 30%
 */
class HolidayPricing extends PricingStrategy {
  calculatePrice(basePrice, context = {}) {
    return Math.round(basePrice * 1.3);
  }
}

module.exports = HolidayPricing;

