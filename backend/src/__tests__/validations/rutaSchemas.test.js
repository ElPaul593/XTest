const { authSchemas, rutaSchemas } = require('../../validations/schemas');

describe('Validación de rutas administrativas', () => {
  const validRoute = {
    from: 'Quito',
    to: 'Cuenca',
    price: 10,
    duration: 4,
    horaSalida: '08:00',
    seats: 40
  };

  test.each([1, 16, 9.5])('acepta duración numérica válida: %s', (duration) => {
    const { error } = rutaSchemas.create.validate({ ...validRoute, duration });
    expect(error).toBeUndefined();
  });

  test.each([0, 16.5, 20, '4 horas', 'cuatro'])('rechaza duración inválida: %s', (duration) => {
    const { error } = rutaSchemas.create.validate({ ...validRoute, duration });
    expect(error).toBeDefined();
  });

  test('rechaza una duración enviada como texto numérico', () => {
    const { error } = rutaSchemas.create.validate({ ...validRoute, duration: '4' }, { convert: false });
    expect(error).toBeDefined();
  });

  test('mantiene la validación de los campos requeridos de una ruta', () => {
    const { error } = rutaSchemas.create.validate({ duration: 4 });
    expect(error).toBeDefined();
  });

  test.each([
    ['precio', { price: '2e0' }],
    ['duración', { duration: '4e1' }],
    ['asientos', { seats: '40a' }]
  ])('rechaza letras o notación científica en %s', (_field, invalidValue) => {
    const { error } = rutaSchemas.create.validate({ ...validRoute, ...invalidValue }, { convert: false });
    expect(error).toBeDefined();
  });

  test('acepta decimales válidos en precio y duración, y enteros en asientos', () => {
    const { error } = rutaSchemas.create.validate({
      ...validRoute,
      price: 12.5,
      duration: 4.5,
      seats: 45
    });
    expect(error).toBeUndefined();
  });

  test('rechaza asientos decimales', () => {
    const { error } = rutaSchemas.create.validate({ ...validRoute, seats: 40.5 });
    expect(error).toBeDefined();
  });
});
