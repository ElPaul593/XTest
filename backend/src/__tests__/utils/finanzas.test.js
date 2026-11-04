const { resumirMovimientos } = require('../../utils/finanzas');

describe('resumirMovimientos', () => {
  test('separa cobros, comisiones y retiros', () => {
    const resumen = resumirMovimientos([
      { importe: '23.75', comision: '-1.58' },
      { importe: '-22.17', comision: null },
      { importe: '10.00', comision: '-0.80' }
    ]);

    expect(resumen).toEqual({ ingresos: 33.75, comisiones: 2.38, retiros: 22.17, egresos: 24.55 });
  });

  test('sin movimientos devuelve ceros', () => {
    expect(resumirMovimientos()).toEqual({ ingresos: 0, comisiones: 0, retiros: 0, egresos: 0 });
  });
});
