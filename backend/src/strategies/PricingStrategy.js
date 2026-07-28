/**
 * Strategy Pattern: Interfaz base para estrategias de pricing
 */
class PricingStrategy {
  calculatePrice(basePrice, context = {}) {
    throw new Error('calculatePrice debe ser implementado por la estrategia');
  }
}

module.exports = PricingStrategy;

