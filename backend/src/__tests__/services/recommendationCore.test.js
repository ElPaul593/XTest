jest.mock('../../repositories/calificacionRepo', () => ({
  findByTipoYReferenciaIn: jest.fn()
}));
jest.mock('../../repositories/lugarTuristicoRepo', () => ({
  findByCiudad: jest.fn()
}));
jest.mock('../../repositories/rutaRepo', () => ({
  findByDestino: jest.fn()
}));
jest.mock('../../models/lugaresRecomendadosModel', () => ({
  bulkWrite: jest.fn()
}));

const CalificacionRepo = require('../../repositories/calificacionRepo');
const LugarTuristicoRepo = require('../../repositories/lugarTuristicoRepo');
const RecommendationCore = require('../../core/recommendationCore');

const lugares = [
  { _id:'museo-1', nombre:'Museo', tipo:'Museo' },
  { _id:'parque-1', nombre:'Parque', tipo:'Parque' },
  { _id:'fuera-provincia-1', nombre:'Solo voto externo', tipo:'Monumento' }
];

const calificaciones = [
  { referencia:'museo-1', calificacion:4, usuario:{ provincia:'Guayas' } },
  { referencia:'museo-1', calificacion:5, usuario:{ provincia:'Guayas' } },
  { referencia:'museo-1', calificacion:5, usuario:{ provincia:'Pichincha' } },
  ...[4, 4, 4, 4, 4, 4].map(calificacion => ({
    referencia:'parque-1', calificacion, usuario:{ provincia:'Guayas' }
  })),
  { referencia:'fuera-provincia-1', calificacion:5, usuario:{ provincia:'Pichincha' } }
];

beforeEach(() => {
  jest.clearAllMocks();
  LugarTuristicoRepo.findByCiudad.mockResolvedValue(lugares);
  CalificacionRepo.findByTipoYReferenciaIn.mockResolvedValue(calificaciones);
});

describe('RecommendationCore.getRecomendadosPorProvincia', () => {
  test('filtra los votos de otras provincias y prioriza la preferencia del usuario', async () => {
    const personalizados = await RecommendationCore.getRecomendadosPorProvincia(
      'Guayas',
      'Guayaquil',
      null,
      ['Museo']
    );
    const generales = await RecommendationCore.getRecomendadosPorProvincia(
      'Guayas',
      'Guayaquil',
      null,
      []
    );

    expect(personalizados.map(item => item.nombre)).toEqual(['Museo', 'Parque']);
    expect(personalizados[0]).toMatchObject({
      totalCalificaciones:2,
      totalCalificacionesGenerales:3
    });
    expect(personalizados[0].score).toBeCloseTo(4.104);
    expect(generales.map(item => item.nombre)).toEqual(['Parque', 'Museo']);
    expect(personalizados).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ nombre:'Solo voto externo' })
    ]));
  });
});
