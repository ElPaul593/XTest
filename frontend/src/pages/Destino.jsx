import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getHoteles } from '../services/hoteles';
import { getLugaresTuristicos } from '../services/lugaresTuristicos';
import { getCalificaciones, createCalificacion } from '../services/calificaciones';
import { OPCIONES_CALIFICACION, CALIFICACION_DEFAULT } from '../constants/calificaciones';

export default function Destino() {
  const [searchParams] = useSearchParams();
  const ciudad = searchParams.get('ciudad') || '';
  const navigate = useNavigate();
  
  const [hoteles, setHoteles] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hoteles'); // 'hoteles' o 'lugares'
  const [calificaciones, setCalificaciones] = useState({});
  const [showCalificarModal, setShowCalificarModal] = useState(null);
  const [calificacionForm, setCalificacionForm] = useState({ calificacion: CALIFICACION_DEFAULT, recomendacion: '' });
  const [erroresImagen, setErroresImagen] = useState({});

  const getFallbackImageUrl = (lugar) => {
    const seed = encodeURIComponent(`${lugar.nombre}-${lugar.ciudad}`.toLowerCase());
    return `https://picsum.photos/seed/${seed}/900/600`;
  };

  useEffect(() => {
    if (!ciudad) {
      navigate('/boletos');
      return;
    }
    loadData();
  }, [ciudad]);

  useEffect(() => {
    // Recargar calificaciones cuando cambien hoteles o lugares
    if (hoteles.length > 0 || lugares.length > 0) {
      loadCalificaciones();
    }
  }, [hoteles.length, lugares.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ciudadNormalizada = ciudad.trim();
      console.log('Buscando lugares turísticos para ciudad:', ciudadNormalizada);
      
      const [hotelesData, lugaresData] = await Promise.all([
        getHoteles(ciudadNormalizada).catch((err) => {
          console.error('Error obteniendo hoteles:', err);
          return [];
        }),
        getLugaresTuristicos(ciudadNormalizada).catch((err) => {
          console.error('Error obteniendo lugares turísticos:', err);
          return [];
        })
      ]);
      
      console.log('Hoteles recibidos:', hotelesData);
      console.log('Lugares turísticos recibidos:', lugaresData);
      
      setHoteles(Array.isArray(hotelesData) ? hotelesData : []);
      setLugares(Array.isArray(lugaresData) ? lugaresData : []);
      
      // Cargar calificaciones para todos los items
      await loadCalificaciones();
    } catch (err) {
      console.error('Error cargando datos:', err);
      setHoteles([]);
      setLugares([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalificaciones = async () => {
    if (hoteles.length === 0 && lugares.length === 0) return;
    
    const calificacionesMap = {};
    
    // Cargar calificaciones de hoteles
    for (const hotel of hoteles) {
      try {
        const califs = await getCalificaciones('hotel', hotel._id);
        const promedio = califs.length > 0
          ? califs.reduce((sum, c) => sum + c.calificacion, 0) / califs.length
          : 0;
        calificacionesMap[`hotel-${hotel._id}`] = { calificaciones: califs, promedio };
      } catch (err) {
        console.error(`Error cargando calificaciones del hotel ${hotel._id}:`, err);
      }
    }
    
    // Cargar calificaciones de lugares
    for (const lugar of lugares) {
      try {
        const califs = await getCalificaciones('lugarTuristico', lugar._id);
        const promedio = califs.length > 0
          ? califs.reduce((sum, c) => sum + c.calificacion, 0) / califs.length
          : 0;
        calificacionesMap[`lugarTuristico-${lugar._id}`] = { calificaciones: califs, promedio };
      } catch (err) {
        console.error(`Error cargando calificaciones del lugar ${lugar._id}:`, err);
      }
    }
    
    setCalificaciones(calificacionesMap);
  };

  const handleCalificar = async (tipo, referencia) => {
    try {
      // El backend obtendrá el usuario del token automáticamente
      await createCalificacion({
        tipo,
        referencia,
        calificacion: calificacionForm.calificacion,
        recomendacion: calificacionForm.recomendacion
      });
      setShowCalificarModal(null);
      setCalificacionForm({ calificacion: CALIFICACION_DEFAULT, recomendacion: '' });
      await loadCalificaciones();
      await loadData();
    } catch (err) {
      alert('Error al guardar calificación: ' + err.message);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) {
    return <div className="destino-container"><div className="loading">Cargando...</div></div>;
  }

  return (
    <div className="destino-container">
      <div className="destino-header">
        <h1>Destino: {ciudad}</h1>
        <p>Explora hoteles y lugares turísticos en {ciudad}</p>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'hoteles' ? 'active' : ''}
          onClick={() => setActiveTab('hoteles')}
        >
          Hoteles ({hoteles.length})
        </button>
        <button 
          className={activeTab === 'lugares' ? 'active' : ''}
          onClick={() => setActiveTab('lugares')}
        >
          Lugares Turísticos ({lugares.length})
        </button>
      </div>

      {activeTab === 'hoteles' && (
        <div className="items-grid">
          {hoteles.length === 0 ? (
            <p>No hay hoteles disponibles en {ciudad}</p>
          ) : (
            hoteles.map(hotel => {
              const califData = calificaciones[`hotel-${hotel._id}`] || { promedio: 0, calificaciones: [] };
              return (
                <div key={hotel._id} className="item-card">
                  <h3>{hotel.nombre}</h3>
                  <p className="direccion">{hotel.direccion}</p>
                  {hotel.descripcion && <p className="descripcion">{hotel.descripcion}</p>}
                  {hotel.telefono && <p className="info">Tel: {hotel.telefono}</p>}
                  {hotel.precioPromedio && <p className="precio">Precio promedio: ${hotel.precioPromedio}</p>}
                  <div className="rating">
                    <span className="stars">{renderStars(califData.promedio)}</span>
                    <span className="rating-text">
                      {califData.promedio > 0 ? califData.promedio.toFixed(1) : 'Sin calificaciones'} 
                      ({califData.calificaciones.length} reseñas)
                    </span>
                  </div>
                  <button 
                    className="btn-calificar"
                    onClick={() => setShowCalificarModal({ tipo: 'hotel', referencia: hotel._id, nombre: hotel.nombre })}
                  >
                    Calificar y Recomendar
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'lugares' && (
        <div className="items-grid">
          {lugares.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No hay lugares turísticos disponibles en {ciudad}</p>
              <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '1rem' }}>
                Si eres administrador, asegúrate de poblar la base de datos usando el endpoint: POST /api/lugares-turisticos/seed
              </p>
            </div>
          ) : (
            lugares.map(lugar => {
              const califData = calificaciones[`lugarTuristico-${lugar._id}`] || { promedio: 0, calificaciones: [] };
              const imagenInicial = lugar.imagen || getFallbackImageUrl(lugar);
              const imagenDisponible = !erroresImagen[lugar._id];
              return (
                <div key={lugar._id} className="item-card">
                  <div className="item-card-image">
                    {imagenDisponible ? (
                      <img
                        src={imagenInicial}
                        alt={lugar.nombre}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Primer fallo: intentar una URL estable por semilla; segundo fallo: ocultar imagen.
                          if (e.currentTarget.dataset.fallbackApplied !== '1') {
                            e.currentTarget.dataset.fallbackApplied = '1';
                            e.currentTarget.src = getFallbackImageUrl(lugar);
                            return;
                          }
                          setErroresImagen((prev) => ({ ...prev, [lugar._id]: true }));
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ccc',
                          background: '#1a1a1a',
                          fontSize: '0.95rem'
                        }}
                      >
                        Imagen no disponible
                      </div>
                    )}
                  </div>
                  <div className="item-card-body">
                    <h3>{lugar.nombre}</h3>
                    <p className="tipo">{lugar.tipo}</p>
                    <p>{lugar.direccion}</p>
                    {lugar.descripcion && <p>{lugar.descripcion}</p>}
                    {lugar.horario && <p>Horario: {lugar.horario}</p>}
                    {lugar.precioEntrada > 0 && <p className="precio">Entrada: ${lugar.precioEntrada}</p>}
                    <div className="rating">
                      <span className="stars">{renderStars(califData.promedio)}</span>
                      <span className="rating-text">
                        {califData.promedio > 0 ? califData.promedio.toFixed(1) : 'Sin calificaciones'}
                        ({califData.calificaciones.length} reseñas)
                      </span>
                    </div>
                    <button 
                      className="btn-calificar"
                      onClick={() => setShowCalificarModal({ tipo: 'lugarTuristico', referencia: lugar._id, nombre: lugar.nombre })}
                    >
                      Calificar y Recomendar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showCalificarModal && (
        <div className="modal-overlay" onClick={() => setShowCalificarModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Calificar: {showCalificarModal.nombre}</h2>
            <div className="form-group">
              <label>Calificación (1-5 estrellas)</label>
              <select 
                value={calificacionForm.calificacion}
                onChange={(e) => setCalificacionForm({ ...calificacionForm, calificacion: parseInt(e.target.value) })}
              >
                {OPCIONES_CALIFICACION.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Recomendación</label>
              <textarea
                value={calificacionForm.recomendacion}
                onChange={(e) => setCalificacionForm({ ...calificacionForm, recomendacion: e.target.value })}
                placeholder="Escribe tu recomendación..."
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCalificarModal(null)}>Cancelar</button>
              <button 
                className="btn-primary"
                onClick={() => handleCalificar(showCalificarModal.tipo, showCalificarModal.referencia)}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

