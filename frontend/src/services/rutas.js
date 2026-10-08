import api from './api';

/**
 * Obtiene todas las rutas disponibles
 */
export async function getRutas() {
  try {
    const response = await api.get('/rutas');
    return response.data;
  } catch (err) {
    console.error('Error fetching rutas:', err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener rutas');
  }
}

/**
 * Obtiene una ruta por ID (hace fetch fresco al backend)
 */
export async function getRutaById(id) {
  try {
    const response = await api.get(`/rutas/${id}`);
    return response.data;
  } catch (err) {
    console.error(`Error fetching ruta ${id}:`, err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener la ruta');
  }
}

/**
 * Crea una ruta (Admin). El backend deriva el nombre de from-to si no se envía.
 */
export async function createRuta(data) {
  try {
    const response = await api.post('/rutas', data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al crear la ruta');
  }
}

export async function updateRuta(id, data) {
  try {
    const response = await api.put(`/rutas/${id}`, data);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al actualizar la ruta');
  }
}

/**
 * Elimina una ruta por ID (Admin).
 */
export async function deleteRuta(id) {
  try {
    const response = await api.delete(`/rutas/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message || 'Error al eliminar la ruta');
  }
}

/**
 * Obtiene rutas filtradas por provincia de origen
 * @param {string} provincia - Nombre de la provincia
 */
export async function getRutasPorProvincia(provincia) {
  try {
    const response = await api.get('/rutas');
    const todasLasRutas = response.data;

    // Filtrar rutas que salgan de ciudades en la provincia seleccionada
    // Nota: Esto asume que el backend devuelve todas las rutas y filtramos aquí
    // Idealmente el backend debería soportar filtrado por provincia

    // Mapa simple de ciudades por provincia (puedes expandirlo)
    const ciudadesPorProvincia = {
      'Pichincha': ['Quito', 'Cayambe', 'Sangolquí'],
      'Guayas': ['Guayaquil', 'Duran', 'Milagro'],
      'Azuay': ['Cuenca', 'Gualaceo'],
      'Manabí': ['Portoviejo', 'Manta', 'Chone'],
      'Loja': ['Loja', 'Catamayo'],
      'Imbabura': ['Ibarra', 'Otavalo'],
      'Tungurahua': ['Ambato', 'Baños'],
      'El Oro': ['Machala', 'Pasaje'],
      'Esmeraldas': ['Esmeraldas', 'Atacames'],
      'Chimborazo': ['Riobamba'],
      'Los Ríos': ['Babahoyo', 'Quevedo'],
      'Cotopaxi': ['Latacunga'],
      'Santo Domingo de los Tsáchilas': ['Santo Domingo'],
      'Santa Elena': ['Santa Elena', 'Salinas'],
      'Carchi': ['Tulcán'],
      'Bolívar': ['Guaranda'],
      'Cañar': ['Azogues'],
      'Pastaza': ['Puyo'],
      'Napo': ['Tena'],
      'Morona Santiago': ['Macas'],
      'Zamora Chinchipe': ['Zamora'],
      'Sucumbíos': ['Nueva Loja'],
      'Orellana': ['Francisco de Orellana'],
      'Galápagos': ['Puerto Ayora', 'Puerto Baquerizo Moreno']
    };

    if (!provincia) return todasLasRutas;

    const ciudades = ciudadesPorProvincia[provincia] || [];

    // Si no tenemos mapa de ciudades para esa provincia, retornamos array vacío o todas
    if (ciudades.length === 0) return [];

    return todasLasRutas.filter(ruta =>
      ciudades.some(ciudad =>
        ruta.from && ruta.from.toLowerCase().includes(ciudad.toLowerCase())
      )
    );
  } catch (err) {
    console.error(`Error fetching rutas por provincia ${provincia}:`, err);
    throw new Error(err.response?.data?.error || err.message || 'Error al obtener rutas por provincia');
  }
}
