const { validarCedulaEcuatoriana } = require('../../utils/cedulaValidator');

describe('validarCedulaEcuatoriana', () => {
  test('acepta una cédula ecuatoriana válida', () => {
    expect(validarCedulaEcuatoriana('1722108188')).toBe(true);
  });

  test('rechaza una cédula con dígito verificador incorrecto', () => {
    expect(validarCedulaEcuatoriana('1722108189')).toBe(false);
  });

  test('rechaza una cédula con longitud o caracteres inválidos', () => {
    expect(validarCedulaEcuatoriana('172210818')).toBe(false);
    expect(validarCedulaEcuatoriana('17221081A8')).toBe(false);
  });

  test('rechaza una cédula con provincia inválida', () => {
    expect(validarCedulaEcuatoriana('0022108188')).toBe(false);
  });

  test('rechaza valores vacíos o ausentes', () => {
    expect(validarCedulaEcuatoriana('')).toBe(false);
    expect(validarCedulaEcuatoriana(null)).toBe(false);
    expect(validarCedulaEcuatoriana(undefined)).toBe(false);
  });
});
