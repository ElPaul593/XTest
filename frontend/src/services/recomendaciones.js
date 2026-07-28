import api from './api';

export async function getRecomendados(ciudad, tipo = 'lugarTuristico', usuarioId = null) {
  try {
    const params = new URLSearchParams();
    params.append('ciudad', ciudad);
    params.append('tipo', tipo);
    if (usuarioId) params.append('usuarioId', usuarioId);
    
    const resp = await api.get(`/recomendaciones?${params.toString()}`);
    return resp.data;
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || 'Error al obtener recomendaciones';
    throw new Error(message);
  }
}

