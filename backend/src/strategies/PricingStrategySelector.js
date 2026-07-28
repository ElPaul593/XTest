const StandardPricing = require('./StandardPricing');
const HolidayPricing = require('./HolidayPricing');
const LastMinutePricing = require('./LastMinutePricing');

/**
 * Selector de estrategia de pricing
 * Determina qué estrategia usar según el contexto
 */
class PricingStrategySelector {
  constructor() {
    this.strategies = {
      standard: new StandardPricing(),
      holiday: new HolidayPricing(),
      lastMinute: new LastMinutePricing()
    };
  }

  /**
   * Selecciona y aplica la estrategia de pricing apropiada
   * @param {number} basePrice - Precio base
   * @param {object} context - Contexto (fecha, horas hasta salida, etc.)
   * @returns {number} Precio calculado
   */
  calculatePrice(basePrice, context = {}) {
    let strategy = this.strategies.standard;

    // Verificar si es día festivo
    if (context.isHoliday) {
      strategy = this.strategies.holiday;
    }
    // Verificar si es reserva de última hora
    else if (context.hoursUntilDeparture && context.hoursUntilDeparture < 24) {
      strategy = this.strategies.lastMinute;
    }

    return strategy.calculatePrice(basePrice, context);
  }
}

module.exports = PricingStrategySelector;

