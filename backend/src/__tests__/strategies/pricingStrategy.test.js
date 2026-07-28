const StandardPricing = require('../src/strategies/StandardPricing');
const HolidayPricing = require('../src/strategies/HolidayPricing');
const LastMinutePricing = require('../src/strategies/LastMinutePricing');
const PricingStrategySelector = require('../src/strategies/PricingStrategySelector');

describe('PricingStrategy Tests', () => {
  describe('StandardPricing', () => {
    test('debe retornar el precio base sin modificaciones', () => {
      const strategy = new StandardPricing();
      const basePrice = 100;
      const result = strategy.calculatePrice(basePrice);
      expect(result).toBe(100);
    });
  });

  describe('HolidayPricing', () => {
    test('debe incrementar el precio en 30%', () => {
      const strategy = new HolidayPricing();
      const basePrice = 100;
      const result = strategy.calculatePrice(basePrice);
      expect(result).toBe(130);
    });

    test('debe redondear correctamente', () => {
      const strategy = new HolidayPricing();
      const basePrice = 99;
      const result = strategy.calculatePrice(basePrice);
      expect(result).toBe(129); // 99 * 1.3 = 128.7 -> 129
    });
  });

  describe('LastMinutePricing', () => {
    test('debe incrementar precio en 20% si faltan menos de 24 horas', () => {
      const strategy = new LastMinutePricing();
      const basePrice = 100;
      const context = { hoursUntilDeparture: 12 };
      const result = strategy.calculatePrice(basePrice, context);
      expect(result).toBe(120);
    });

    test('debe retornar precio base si faltan más de 24 horas', () => {
      const strategy = new LastMinutePricing();
      const basePrice = 100;
      const context = { hoursUntilDeparture: 48 };
      const result = strategy.calculatePrice(basePrice, context);
      expect(result).toBe(100);
    });

    test('debe retornar precio base si no hay contexto', () => {
      const strategy = new LastMinutePricing();
      const basePrice = 100;
      const result = strategy.calculatePrice(basePrice);
      expect(result).toBe(100);
    });
  });

  describe('PricingStrategySelector', () => {
    test('debe usar StandardPricing por defecto', () => {
      const selector = new PricingStrategySelector();
      const basePrice = 100;
      const result = selector.calculatePrice(basePrice);
      expect(result).toBe(100);
    });

    test('debe usar HolidayPricing si es día festivo', () => {
      const selector = new PricingStrategySelector();
      const basePrice = 100;
      const context = { isHoliday: true };
      const result = selector.calculatePrice(basePrice, context);
      expect(result).toBe(130);
    });

    test('debe usar LastMinutePricing si es reserva de última hora', () => {
      const selector = new PricingStrategySelector();
      const basePrice = 100;
      const context = { hoursUntilDeparture: 12 };
      const result = selector.calculatePrice(basePrice, context);
      expect(result).toBe(120);
    });

    test('debe priorizar HolidayPricing sobre LastMinutePricing', () => {
      const selector = new PricingStrategySelector();
      const basePrice = 100;
      const context = { isHoliday: true, hoursUntilDeparture: 12 };
      const result = selector.calculatePrice(basePrice, context);
      expect(result).toBe(130); // Holiday tiene prioridad
    });
  });
});

