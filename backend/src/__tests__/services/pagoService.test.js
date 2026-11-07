jest.mock('axios', () => jest.fn());
jest.mock('../../models/pagoModel', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../../models/reservaModel', () => ({
  create: jest.fn()
}));
jest.mock('../../config/externalApis', () => ({
  seatApiUrl: jest.fn((clave, sufijo = '') => `https://seat-api.test/${clave}${sufijo}`),
  PAGO_REQUEST_TIMEOUT_MS: 1000
}));
jest.mock('../../utils/finanzas', () => ({
  resumirMovimientos: jest.fn()
}));

const axios = require('axios');
const Pago = require('../../models/pagoModel');
const Reserva = require('../../models/reservaModel');
const PagoService = require('../../services/pagoService');

describe('PagoService.aprobar', () => {
  const pagoPendiente = () => ({
    orderId: 'ORDER-123',
    user: 'user-123',
    estado: 'EN_REVISION',
    asientos: [14, 18],
    save: jest.fn()
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no marca el pago como pagado si la API externa responde 404', async () => {
    const pago = pagoPendiente();
    Pago.findOne.mockResolvedValue(pago);
    axios.mockRejectedValue({ response: { status: 404, data: { error: 'Orden no encontrada' } } });

    await expect(PagoService.aprobar('ORDER-123')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Orden no encontrada'
    });

    expect(pago.estado).toBe('EN_REVISION');
    expect(pago.save).not.toHaveBeenCalled();
    expect(Reserva.create).not.toHaveBeenCalled();
  });

  test('marca como pagado y entrega los asientos solo después de aprobar en la API externa', async () => {
    const pago = pagoPendiente();
    const reserva = { _id: 'reserva-123' };
    Pago.findOne.mockResolvedValue(pago);
    Reserva.create.mockResolvedValue(reserva);
    axios.mockResolvedValue({ data: { ok: true } });

    await PagoService.aprobar('ORDER-123');

    expect(Reserva.create).toHaveBeenCalledWith(expect.objectContaining({
      user: pago.user,
      seatNumbers: pago.asientos
    }));
    expect(pago.estado).toBe('PAGADO');
    expect(pago.reserva).toBe(reserva._id);
    expect(pago.save).toHaveBeenCalled();
  });
});
