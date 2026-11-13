import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRecomendados } from '../services/recomendaciones';
import { TIPOS_RECOMENDACION, TIPO_DEFAULT } from '../constants/recomendaciones';
import { API_BASE_URL } from '../constants/api';
import { AlertPopup } from '../components/Popup';

function resolverImagen(item) {
  const url = item?.imagen || item?.fotoUrl;
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const base = API_BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

export default function Recomendados() {
  const [searchParams] = useSearchParams();
  const ciudad = searchParams.get('ciudad') || '';
  const navigate = useNavigate();
  
  const [recomendados, setRecomendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState(TIPO_DEFAULT);
  const [usuarioId, setUsuarioId] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

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
      /**
       * #33BUG — Avisos con el diálogo nativo del navegador en lugar de una ventana
       * emergente de la aplicación.
       *
       * Esta pantalla usa 1 llamada nativa. Un `alert` al fallar la carga de recomendaciones.
       *
       * Tres problemas concretos:
       *
       *  1. `alert()` y `confirm()` bloquean el hilo principal: mientras el diálogo
       *     está abierto, React no puede repintar ni se ejecutan los temporizadores.
       *     En las pantallas de asientos eso congela el contador del hold.
       *  2. El navegador los pinta con su propio estilo, ajeno al negro + amarillo del
       *     proyecto, y antepone el dominio ("localhost:3000 dice…").
       *  3. No admiten formato ni contenido enriquecido, así que los mensajes largos
       *     se apelmazan y los saltos de línea con `\n` se ven de forma distinta en
       *     cada navegador.
       *
       * Sustitución disponible: `components/Popup.jsx` (`AlertPopup` para avisar,
       * `ConfirmPopup` para confirmar) junto al hook `hooks/useFeedback.js`. Se
       * renderizan con `createPortal` sobre `document.body` y en la capa `--z-modal`,
       * por encima del navbar fijo. Ya están aplicados en `LoginForm`, `Profile`,
       * `Dashboard` y `admin/AdminUsers` y pueden servir de referencia.
       *
       * NO se corrige aquí por indicación expresa: solo se documenta.
       */
      setPopupMessage({
        title: 'No se pudieron cargar las recomendaciones',
        message: err.message || 'Error desconocido',
        variant: 'error'
      });
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
      <AlertPopup
        open={Boolean(popupMessage)}
        onClose={() => setPopupMessage(null)}
        title={popupMessage?.title}
        message={popupMessage?.message}
        variant={popupMessage?.variant}
      />
      <div className="recomendados-header">
        <h1>Recomendados para ti en {ciudad}</h1>
        <p>
          {tipo === 'hotel'
            ? 'Hoteles ordenados por la calificación global de todos los usuarios'
            : usuarioId
            ? 'Recomendaciones personalizadas basadas en tu provincia y las votaciones de usuarios de tu provincia'
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
              {resolverImagen(item) ? (
                <img
                  className="recomendado-card__image"
                  src={resolverImagen(item)}
                  alt={`Imagen de ${item.nombre}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="recomendado-card__image recomendado-card__image--fallback" aria-hidden="true">
                  🏞️
                </div>
              )}
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
                  <span className="stat-value stat-value--rating">
                    <span className="rating-stars" aria-label="Estrellas de calificación">
                      {renderStars(item.promedioGeneral || item.calificacionPromedio || 0)}
                    </span>
                    <span className="rating-number">
                      {(item.promedioGeneral || item.calificacionPromedio || 0).toFixed(1)}
                    </span>
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
                {item.promedioMismaNacionalidad > 0 && (
                  <div className="stat-item highlight">
                    <span className="stat-label">Tu provincia:</span>
                    <span className="stat-value">
                      {item.promedioMismaNacionalidad.toFixed(1)} ⭐
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
