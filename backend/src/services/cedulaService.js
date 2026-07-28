const { validarCedulaEcuatoriana } = require('../utils/cedulaValidator');

/**
 * Valida una cédula ecuatoriana
 * @param {string} cedula - Cédula a validar
 * @returns {object} - Objeto con el resultado de la validación
 */
exports.validar = (cedula) => {
  const esValida = validarCedulaEcuatoriana(cedula);
  
  return {
    cedula: String(cedula || '').trim(),
    valida: esValida,
    mensaje: esValida 
      ? 'La cédula es válida' 
      : 'La cédula no es válida'
  };
};

