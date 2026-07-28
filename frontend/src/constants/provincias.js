// Códigos de provincias de Ecuador según los primeros 2 dígitos de la cédula
export const PROVINCIAS = {
  '01': 'Azuay',
  '02': 'Bolívar',
  '03': 'Cañar',
  '04': 'Carchi',
  '05': 'Cotopaxi',
  '06': 'Chimborazo',
  '07': 'El Oro',
  '08': 'Esmeraldas',
  '09': 'Guayas',
  '10': 'Imbabura',
  '11': 'Loja',
  '12': 'Los Ríos',
  '13': 'Manabí',
  '14': 'Morona Santiago',
  '15': 'Napo',
  '16': 'Pastaza',
  '17': 'Pichincha',
  '18': 'Tungurahua',
  '19': 'Zamora Chinchipe',
  '20': 'Galápagos',
  '21': 'Sucumbíos',
  '22': 'Orellana',
  '23': 'Santo Domingo de los Tsáchilas',
  '24': 'Santa Elena'
};

// Array de provincias para dropdowns
export const PROVINCIAS_ARRAY = Object.entries(PROVINCIAS).map(([codigo, nombre]) => ({
  codigo,
  nombre
}));

// Función para obtener el nombre de la provincia desde el código
export function getProvinciaByCodigo(codigo) {
  return PROVINCIAS[codigo] || null;
}

// Función para obtener la provincia desde la cédula (primeros 2 dígitos)
export function getProvinciaFromCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') return null;
  
  const cedulaLimpia = cedula.replace(/\D/g, '');
  if (cedulaLimpia.length < 2) return null;
  
  const codigo = cedulaLimpia.substring(0, 2);
  return getProvinciaByCodigo(codigo);
}

