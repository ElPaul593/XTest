

function validarCedulaEcuatoriana(cedula) {
  // Convertir a string y limpiar espacios
  const cedulaStr = String(cedula || '').trim();

  // Verificar que tenga exactamente 10 dígitos
  if (cedulaStr.length !== 10) {
    return false;
  }

  // Verificar que todos los caracteres sean dígitos
  if (!/^\d+$/.test(cedulaStr)) {
    return false;
  }

  // Verificar que los dos primeros dígitos provincia estén entre 01 y 24
  const provincia = parseInt(cedulaStr.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // Verificar que el tercer dígito esté entre 0 y 5
  const tercerDigito = parseInt(cedulaStr[2], 10);
  if (tercerDigito < 0 || tercerDigito > 5) {
    return false;
  }

  // Algoritmo de validación del dígito verificador
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  // Multiplicar los primeros 9 dígitos por los coeficientes
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedulaStr[i], 10) * coeficientes[i];
    
    // Si el resultado es mayor a 9, restar 9
    if (valor > 9) {
      valor -= 9;
    }
    
    suma += valor;
  }

  // Calcular el dígito verificador esperado
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let digitoVerificador = decenaSuperior - suma;
  
  // Si el resultado es 10, el dígito verificador es 0
  if (digitoVerificador === 10) {
    digitoVerificador = 0;
  }

  // Comparar con el décimo dígito de la cédula
  const digitoVerificadorCedula = parseInt(cedulaStr[9], 10);
  
  return digitoVerificador === digitoVerificadorCedula;
}

module.exports = {
  validarCedulaEcuatoriana
};

