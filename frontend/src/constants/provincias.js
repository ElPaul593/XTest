/**
 * Datos de provincias usados por la pantalla de Rutas: deducción de la provincia
 * desde la cédula, regiones y ciudad → provincia.
 */

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

// Provincias agrupadas por región natural (mismo criterio que los colores del mapa)
export const REGIONES = [
  {
    id: 'sierra',
    nombre: 'Sierra',
    provincias: [
      'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'Imbabura',
      'Loja', 'Pichincha', 'Santo Domingo de los Tsáchilas', 'Tungurahua'
    ]
  },
  {
    id: 'costa',
    nombre: 'Costa',
    provincias: ['El Oro', 'Esmeraldas', 'Guayas', 'Los Ríos', 'Manabí', 'Santa Elena']
  },
  {
    id: 'amazonia',
    nombre: 'Amazonía',
    provincias: ['Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Sucumbíos', 'Zamora Chinchipe']
  },
  { id: 'galapagos', nombre: 'Galápagos', provincias: ['Galápagos'] }
];

// Ciudades registradas en el backend (utils/provinciaUtils.js) por provincia real
const CIUDADES_POR_PROVINCIA = {
  Azuay: ['Cuenca', 'Gualaceo'],
  'Bolívar': ['Guaranda', 'San Miguel'],
  'Cañar': ['Azogues', 'Cañar'],
  Carchi: ['Tulcán', 'San Gabriel'],
  Chimborazo: ['Riobamba', 'Guano'],
  Cotopaxi: ['Latacunga', 'Saquisilí'],
  'El Oro': ['Machala', 'Santa Rosa', 'Pasaje', 'Huaquillas', 'Zaruma', 'Piñas'],
  Esmeraldas: ['Esmeraldas', 'Atacames', 'San Lorenzo', 'Muisne'],
  Guayas: ['Guayaquil', 'Daule', 'Samborondón'],
  Imbabura: ['Ibarra', 'Otavalo', 'Atuntaqui'],
  Loja: ['Loja', 'Macará', 'Catamayo', 'Vilcabamba'],
  'Los Ríos': ['Babahoyo', 'Quevedo', 'Ventanas', 'Valencia', 'Vinces'],
  'Manabí': ['Manta', 'Portoviejo', 'Montecristi', 'Puerto López', 'Bahía de Caráquez', 'Jipijapa'],
  'Morona Santiago': ['Macas', 'Gualaquiza', 'Limon Indanza'],
  Napo: ['Tena', 'Archidona', 'Baeza'],
  Orellana: ['Francisco de Orellana', 'Coca'],
  Pastaza: ['Puyo', 'Mera'],
  Pichincha: ['Quito', 'Sangolquí', 'Cayambe'],
  'Santa Elena': ['Santa Elena', 'Salinas', 'Montañita', 'Ayangue'],
  'Santo Domingo de los Tsáchilas': ['Santo Domingo', 'La Concordia'],
  'Sucumbíos': ['Lago Agrio', 'Nueva Loja'],
  Tungurahua: ['Ambato', 'Baños', 'Pelileo'],
  'Zamora Chinchipe': ['Zamora', 'Yantzaza']
};

const CIUDAD_A_PROVINCIA = Object.fromEntries(
  Object.entries(CIUDADES_POR_PROVINCIA).flatMap(([provincia, ciudades]) =>
    ciudades.map((ciudad) => [ciudad, provincia]))
);

export function getProvinciaDeCiudad(ciudad) {
  return CIUDAD_A_PROVINCIA[ciudad] || null;
}
