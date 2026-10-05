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

