const PricingStrategy = require('./PricingStrategy');

/**
 * Estrategia de pricing estándar
 * Precio base sin modificaciones
 */
class StandardPricing extends PricingStrategy {
  calculatePrice(basePrice, context = {}) {
    return basePrice;
  }
}

module.exports = StandardPricing;

