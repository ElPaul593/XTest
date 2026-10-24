/**
 * ============================================================================
 * #27BUG — DIAGNÓSTICO CORREGIDO. Este archivo NO está muerto.
 * ============================================================================
 *
 * La anotación anterior afirmaba que el archivo entero no se importaba. Era
 * FALSA: `components/RegisterForm.jsx` importa y usa `getCodigoTelefonico(pais)`.
 * El error vino de un barrido que comprobaba los símbolos de uno en uno y de
 * escribir una conclusión sobre el archivo completo a partir de dos resultados
 * negativos, sin comprobar el tercer export.
 *
 * Lo que sí está sin usar, y es mucho menos grave:
 *
 *   · `getPaisFromCodigo` — 0 importaciones. Es la operación inversa
 *     (prefijo → país) y ninguna pantalla la necesita.
 *   · `CODIGOS_TELEFONICOS` — no se importa desde fuera, pero NO es código
 *     muerto: es el mapa que consultan las dos funciones de abajo.
 *
 * Sigue siendo válida una observación de la nota original: el registro envía el
 * teléfono como dígitos sin prefijo, y tanto el esquema Joi del backend como el
 * modelo Mongoose validan `/^\d+$/`. El prefijo que arma `getCodigoTelefonico`
 * es, por tanto, solo para mostrarlo en pantalla.
 * ============================================================================
 */

// Códigos telefónicos internacionales por país
export const CODIGOS_TELEFONICOS = {
  'Ecuador': '+593',
  'Colombia': '+57',
  'Perú': '+51',
  'Venezuela': '+58',
  'Argentina': '+54',
  'Chile': '+56',
  'Brasil': '+55',
  'México': '+52',
  'Estados Unidos': '+1',
  'España': '+34',
  'Francia': '+33',
  'Alemania': '+49',
  'Italia': '+39',
  'Reino Unido': '+44',
  'Canadá': '+1',
  'Otro': '+'
};

// Función para obtener el código telefónico de un país
export function getCodigoTelefonico(pais) {
  return CODIGOS_TELEFONICOS[pais] || '+';
}

// Función para obtener el país desde un código telefónico
export function getPaisFromCodigo(codigo) {
  const entry = Object.entries(CODIGOS_TELEFONICOS).find(([_, cod]) => cod === codigo);
  return entry ? entry[0] : null;
}

