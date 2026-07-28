// Mapeo de códigos de provincia de Ecuador según los primeros 2 dígitos de la cédula
const PROVINCIAS = {
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

// Mapeo de ciudades a provincias
const CIUDAD_PROVINCIA = {
  // Pichincha
  'Quito': 'Pichincha',
  'Sangolquí': 'Pichincha',
  'Cayambe': 'Pichincha',
  
  // Guayas
  'Guayaquil': 'Guayas',
  'Salinas': 'Guayas',
  'Santa Elena': 'Guayas',
  'Daule': 'Guayas',
  'Samborondón': 'Guayas',
  
  // Azuay
  'Cuenca': 'Azuay',
  'Cañar': 'Azuay',
  'Azogues': 'Azuay',
  'Gualaceo': 'Azuay',
  
  // Manabí
  'Manta': 'Manabí',
  'Portoviejo': 'Manabí',
  'Montecristi': 'Manabí',
  'Puerto López': 'Manabí',
  'Bahía de Caráquez': 'Manabí',
  'Jipijapa': 'Manabí',
  
  // Tungurahua
  'Ambato': 'Tungurahua',
  'Baños': 'Tungurahua',
  'Pelileo': 'Tungurahua',
  
  // Imbabura
  'Ibarra': 'Imbabura',
  'Otavalo': 'Imbabura',
  'Atuntaqui': 'Imbabura',
  
  // Loja
  'Loja': 'Loja',
  'Macará': 'Loja',
  'Catamayo': 'Loja',
  'Vilcabamba': 'Loja',
  
  // Chimborazo
  'Riobamba': 'Chimborazo',
  'Guano': 'Chimborazo',
  
  // Cotopaxi
  'Latacunga': 'Cotopaxi',
  'Saquisilí': 'Cotopaxi',
  
  // El Oro
  'Machala': 'El Oro',
  'Santa Rosa': 'El Oro',
  'Pasaje': 'El Oro',
  'Huaquillas': 'El Oro',
  
  // Esmeraldas
  'Esmeraldas': 'Esmeraldas',
  'Atacames': 'Esmeraldas',
  'San Lorenzo': 'Esmeraldas',
  'Muisne': 'Esmeraldas',
  
  // Carchi
  'Tulcán': 'Carchi',
  'San Gabriel': 'Carchi',
  
  // Bolívar
  'Guaranda': 'Bolívar',
  'San Miguel': 'Bolívar',
  
  // Los Ríos
  'Babahoyo': 'Los Ríos',
  'Quevedo': 'Los Ríos',
  'Ventanas': 'Los Ríos',
  'Valencia': 'Los Ríos',
  
  // Morona Santiago
  'Macas': 'Morona Santiago',
  'Gualaquiza': 'Morona Santiago',
  
  // Napo
  'Tena': 'Napo',
  'Archidona': 'Napo',
  'Baeza': 'Napo',
  
  // Pastaza
  'Puyo': 'Pastaza',
  'Mera': 'Pastaza',
  
  // Zamora Chinchipe
  'Zamora': 'Zamora Chinchipe',
  'Yantzaza': 'Zamora Chinchipe',
  'Gualaquiza': 'Zamora Chinchipe',
  
  // Sucumbíos
  'Lago Agrio': 'Sucumbíos',
  'Nueva Loja': 'Sucumbíos',
  
  // Orellana
  'Francisco de Orellana': 'Orellana',
  'Coca': 'Orellana',
  
  // Santo Domingo de los Tsáchilas
  'Santo Domingo': 'Santo Domingo de los Tsáchilas',
  'La Concordia': 'Santo Domingo de los Tsáchilas',
  
  // Santa Elena
  'Montañita': 'Santa Elena',
  'Salinas': 'Santa Elena'
};

/**
 * Obtiene la provincia desde el código de la cédula (primeros 2 dígitos)
 * @param {string} cedula - Cédula ecuatoriana
 * @returns {string|null} - Nombre de la provincia o null
 */
function getProvinciaFromCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') return null;
  
  const cedulaLimpia = cedula.replace(/\D/g, '');
  if (cedulaLimpia.length < 2) return null;
  
  const codigo = cedulaLimpia.substring(0, 2);
  return PROVINCIAS[codigo] || null;
}

/**
 * Obtiene la provincia desde el nombre de la ciudad
 * @param {string} ciudad - Nombre de la ciudad
 * @returns {string|null} - Nombre de la provincia o null
 */
function getProvinciaFromCiudad(ciudad) {
  if (!ciudad || typeof ciudad !== 'string') return null;
  return CIUDAD_PROVINCIA[ciudad] || null;
}

/**
 * Obtiene las ciudades principales de una provincia
 * @param {string} provincia - Nombre de la provincia
 * @returns {string[]} - Array de ciudades principales
 */
function getCiudadesDeProvincia(provincia) {
  if (!provincia || typeof provincia !== 'string') return [];
  
  const ciudades = [];
  for (const [ciudad, prov] of Object.entries(CIUDAD_PROVINCIA)) {
    if (prov === provincia) {
      ciudades.push(ciudad);
    }
  }
  return ciudades;
}

module.exports = {
  PROVINCIAS,
  CIUDAD_PROVINCIA,
  getProvinciaFromCedula,
  getProvinciaFromCiudad,
  getCiudadesDeProvincia
};

