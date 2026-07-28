import api from './api';

/**
 * Valida una cédula ecuatoriana
 * @param {string} cedula - Cédula a validar
 * @returns {Promise<object>} - Objeto con el resultado de la validación
 */
export async function validarCedula(cedula) {
  try {
    const resp = await api.post('/cedula/validar', { cedula });
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.mensaje || err?.response?.data?.error || err.message || 'Error al validar la cédula';
    throw new Error(message);
  }
}

