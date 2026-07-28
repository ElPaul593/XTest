import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRecomendados } from '../services/recomendaciones';
import { TIPOS_RECOMENDACION, TIPO_DEFAULT } from '../constants/recomendaciones';

export default function Recomendados() {
  const [searchParams] = useSearchParams();
  const ciudad = searchParams.get('ciudad') || '';
  const navigate = useNavigate();
  
  const [recomendados, setRecomendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState(TIPO_DEFAULT);
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    // Obtener userId del token si está disponible
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar el token para obtener el userId (simplificado)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsuarioId(payload.id);
      } catch (err) {
        console.error('Error decodificando token:', err);
      }
    }
    
    if (ciudad) {
      loadRecomendados();
    } else {
      navigate('/boletos');
    }
  }, [ciudad, tipo, usuarioId]);

  const loadRecomendados = async () => {
    try {
      setLoading(true);
      const data = await getRecomendados(ciudad, tipo, usuarioId);
      // Asegurar que data sea un array
      if (Array.isArray(data)) {
        setRecomendados(data);
      } else if (data && Array.isArray(data.recomendados)) {
        // Si viene en formato { recomendados: [...] }
        setRecomendados(data.recomendados);
      } else {
        console.warn('Formato de datos inesperado:', data);
        setRecomendados([]);
      }
    } catch (err) {
      console.error('Error cargando recomendaciones:', err);
      setRecomendados([]);
      alert('Error al cargar recomendaciones: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) {
    return <div className="recomendados-container"><div className="loading">Cargando recomendaciones...</div></div>;
  }

  return (
    <div className="recomendados-container">
      <div className="recomendados-header">
        <h1>Recomendados para ti en {ciudad}</h1>
        <p>
          {usuarioId 
            ? 'Recomendaciones personalizadas basadas en tu nacionalidad y votaciones recientes'
            : 'Recomendaciones basadas en las mejores calificaciones recientes'}
        </p>
      </div>

      <div className="filters">
        <label>
          Tipo:
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_RECOMENDACION.map((tipoOption) => (
              <option key={tipoOption.value} value={tipoOption.value}>{tipoOption.label}</option>
            ))}
          </select>
        </label>
      </div>

      {recomendados.length === 0 ? (
        <div className="no-recomendaciones">
          <p>No hay recomendaciones disponibles para {ciudad} en este momento.</p>
          <p>¡Sé el primero en calificar y recomendar lugares en esta ciudad!</p>
        </div>
      ) : (
        <div className="recomendados-grid">
          {recomendados.map((item, index) => (
            <div key={item._id} className="recomendado-card">
              <div className="badge-top">
                #{index + 1} Recomendado
              </div>
              <h3>{item.nombre}</h3>
              {item.tipo && <p className="tipo">{item.tipo}</p>}
              <p className="direccion">{item.direccion}</p>
              {item.descripcion && <p className="descripcion">{item.descripcion}</p>}
              
              <div className="stats">
                {item.score !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Score:</span>
                    <span className="stat-value">{typeof item.score === 'number' ? item.score.toFixed(2) : item.score}</span>
                  </div>
                )}
                <div className="stat-item">
                  <span className="stat-label">Calificación:</span>
                  <span className="stat-value">
                    {renderStars(item.promedioGeneral || item.calificacionPromedio || 0)} 
                    {(item.promedioGeneral || item.calificacionPromedio || 0).toFixed(1)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Reseñas:</span>
                  <span className="stat-value">{item.totalCalificaciones || 0}</span>
                </div>
                {item.calificacionesMesActual > 0 && (
                  <div className="stat-item highlight">
                    <span className="stat-label">Este mes:</span>
                    <span className="stat-value">{item.calificacionesMesActual} votos</span>
                  </div>
                )}
                {(item.promedioMismaNacionalidad > 0 || item.calificacionPromedio > 0) && (
                  <div className="stat-item highlight">
                    <span className="stat-label">Tu provincia:</span>
                    <span className="stat-value">
                      {(item.promedioMismaNacionalidad || item.calificacionPromedio || 0).toFixed(1)} ⭐
                    </span>
                  </div>
                )}
              </div>

              {item.precioPromedio && (
                <p className="precio">Precio promedio: ${item.precioPromedio}</p>
              )}
              {item.precioEntrada > 0 && (
                <p className="precio">Entrada: ${item.precioEntrada}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

