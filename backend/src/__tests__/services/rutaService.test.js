jest.mock('../../repositories/rutaRepo', () => ({
  create: jest.fn(),
  updateById: jest.fn(),
  findByEndpoints: jest.fn()
}));

jest.mock('../../services/mapsService', () => ({
  ensureRouteMapData: jest.fn(async (route) => route)
}));

const RutaRepo = require('../../repositories/rutaRepo');
const RutaService = require('../../services/rutaService');

describe('RutaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RutaRepo.findByEndpoints.mockResolvedValue(null);
  });

  test('crea una ruta guardando la duración con formato de horas', async () => {
    const savedRoute = { _id: 'route-1', from: 'Quito', to: 'Cuenca', duration: '4 horas' };
    RutaRepo.create.mockResolvedValue(savedRoute);

    await RutaService.create({
      from: 'Quito',
      to: 'Cuenca',
      price: 10,
      duration: 4,
      horaSalida: '08:00',
      seats: 40
    });

    expect(RutaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Quito - Cuenca',
      duration: '4 horas'
    }));
  });

  test('actualiza una ruta y normaliza la nueva duración', async () => {
    const updatedRoute = { _id: 'route-1', from: 'Quito', to: 'Guayaquil', duration: '16 horas' };
    RutaRepo.updateById.mockResolvedValue(updatedRoute);

    const result = await RutaService.update('route-1', {
      from: 'Quito',
      to: 'Guayaquil',
      price: 18,
      duration: 16,
      horaSalida: '08:00',
      seats: 40
    });

    expect(RutaRepo.updateById).toHaveBeenCalledWith('route-1', expect.objectContaining({
      name: 'Quito - Guayaquil',
      duration: '16 horas'
    }));
    expect(result).toEqual(updatedRoute);
  });

  test('devuelve null si se intenta editar una ruta inexistente', async () => {
    RutaRepo.updateById.mockResolvedValue(null);

    await expect(RutaService.update('missing-route', {
      from: 'Quito',
      to: 'Cuenca',
      duration: 4
    })).resolves.toBeNull();
  });

  test('rechaza una ruta duplicada', async () => {
    RutaRepo.findByEndpoints.mockResolvedValue({ _id: 'existing-route' });

    await expect(RutaService.create({
      from: 'Quito',
      to: 'Cuenca',
      price: 10,
      duration: 4
    })).rejects.toThrow('Ya existe una ruta con ese origen y destino');
  });

  test('rechaza ciudades no registradas y el mismo origen y destino', async () => {
    await expect(RutaService.create({ from: 'Ciudad X', to: 'Quito', duration: 4 }))
      .rejects.toThrow('ciudades registradas');
    await expect(RutaService.create({ from: 'Quito', to: 'quito', duration: 4 }))
      .rejects.toThrow('deben ser diferentes');
  });
});
