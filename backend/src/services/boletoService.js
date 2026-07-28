const BoletoRepo = require('../repositories/boletoRepo');
const ReservaRepo = require('../repositories/reservaRepo');
const Ruta = require('../models/rutaModel');
const PricingStrategySelector = require('../strategies/PricingStrategySelector');

/**
 * PATRÓN DE DISEÑO: Service Layer Pattern
 * Servicio que encapsula la lógica de negocio para boletos.
 * 
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Responsabilidad única: lógica de negocio para boletos.
 * 
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Depende de la abstracción BoletoRepo.
 */

const pricingSelector = new PricingStrategySelector();

exports.getAll = async () => {
  return BoletoRepo.findAll();
};

/**
 * Crea un boleto aplicando la estrategia de pricing apropiada
 * PATRÓN DE DISEÑO: Strategy Pattern aplicado aquí
 */
exports.create = async (data) => {
  // Obtener la reserva y la ruta para calcular el precio
  const Reserva = require('../models/reservaModel');
  const reserva = await Reserva.findById(data.reserva).populate('ruta');
  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }

  const ruta = reserva.ruta;
  if (!ruta) {
    throw new Error('Ruta no encontrada');
  }

  const basePrice = ruta.price;

  // Determinar contexto para la estrategia de pricing
  const now = new Date();
  const departureDate = ruta.departureTime ? new Date(ruta.departureTime) : null;
  const hoursUntilDeparture = departureDate 
    ? Math.floor((departureDate - now) / (1000 * 60 * 60))
    : null;

  // Verificar si es día festivo (simplificado: puedes mejorar esto)
  const isHoliday = false; // Aquí podrías implementar lógica para detectar días festivos

  // Calcular precio usando Strategy Pattern
  const finalPrice = pricingSelector.calculatePrice(basePrice, {
    isHoliday,
    hoursUntilDeparture
  });

  // Crear boleto con precio calculado
  return BoletoRepo.create({
    ...data,
    price: finalPrice
  });
};
