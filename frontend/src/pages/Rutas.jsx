import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/users';
import { PROVINCIAS_ARRAY, getProvinciaFromCedula } from '../constants/provincias';
import { getRutasPorProvincia, getRutas } from '../services/rutas';
import EcuadorMapSelector from '../components/EcuadorMapSelector';

export default function Rutas() {
  const [loading, setLoading] = useState(true);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [user, setUser] = useState(null);
  const [provinciaUsuario, setProvinciaUsuario] = useState(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [rutasRecomendadas, setRutasRecomendadas] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);

        // Si el usuario es ecuatoriano (tiene cédula), obtener su provincia
        if (me.cedula) {
          const provincia = getProvinciaFromCedula(me.cedula);
          setProvinciaUsuario(provincia);
          setProvinciaSeleccionada(provincia || '');
        } else {
          // Si es extranjero, no hay provincia por defecto
          setProvinciaUsuario(null);
        }
      } catch (err) {
        console.error('Error al obtener usuario actual:', err.message);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  // Cargar rutas recomendadas cuando cambie la provincia seleccionada o mostrarTodas
  useEffect(() => {
    if (mostrarTodas) {
      cargarTodasLasRutas();
    } else if (provinciaSeleccionada) {
      cargarRutasPorProvincia(provinciaSeleccionada);
    } else {
      setRutasRecomendadas([]);
    }
  }, [provinciaSeleccionada, mostrarTodas]);

  const formatearRutas = (rutas) => {
    return rutas.map(ruta => ({
      id: ruta._id || ruta.id,
      origen: ruta.from,
      destino: ruta.to,
      nombre: ruta.name,
      asientos: ruta.seats,
      precio: ruta.price ? `$${ruta.price}` : 'Consultar precio',
      duracion: ruta.duration || 'Consultar duración',
      empresa: 'Varias empresas'
    }));
  };

  const cargarRutasPorProvincia = async (provincia) => {
    if (!provincia) {
      setRutasRecomendadas([]);
      return;
    }

    setLoadingRutas(true);
    try {
      const rutas = await getRutasPorProvincia(provincia);
      setRutasRecomendadas(formatearRutas(rutas));
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      setRutasRecomendadas([]);
    } finally {
      setLoadingRutas(false);
    }
  };

  const cargarTodasLasRutas = async () => {
    setLoadingRutas(true);
    try {
      const rutas = await getRutas();
      setRutasRecomendadas(formatearRutas(rutas));
    } catch (err) {
      console.error('Error al cargar todas las rutas:', err);
      setRutasRecomendadas([]);
    } finally {
      setLoadingRutas(false);
    }
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="rutas-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando rutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rutas-container">
      <div className="container">
        <div className="rutas-header">
          <h1>Rutas Recomendadas</h1>
          <p>Descubre las mejores rutas según tu provincia de origen</p>
        </div>

        {/* Mensaje de bienvenida para usuarios ecuatorianos */}
        {user?.cedula && provinciaUsuario && (
          <div className="bienvenida-provincia">
            <h2>BIENVENIDO CIUDADANO DE LA PROVINCIA DE {provinciaUsuario.toUpperCase()}</h2>
            <p>Hemos detectado que eres de {provinciaUsuario} según tu cédula. Aquí tienes rutas recomendadas para ti.</p>
          </div>
        )}

        {/* Mensaje para extranjeros */}
        {!user?.cedula && (
          <div className="bienvenida-provincia">
            <h2>BIENVENIDO</h2>
            <p>Selecciona una provincia para ver las rutas recomendadas.</p>
          </div>
        )}

        {/* Dropdown de provincias y opción para ver todas */}
        <div className="provincia-selector">
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mostrarTodas}
                onChange={(e) => {
                  setMostrarTodas(e.target.checked);
                  if (e.target.checked) {
                    setProvinciaSeleccionada('');
                  }
                }}
              />
              <span>Mostrar todas las rutas disponibles</span>
            </label>
          </div>
          {!mostrarTodas && (
            <>
              <label style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500' }}>
                Selecciona una provincia para ver rutas recomendadas:
              </label>
              <EcuadorMapSelector
                value={provinciaSeleccionada}
                onChange={setProvinciaSeleccionada}
              />
            </>
          )}
        </div>

        {/* Rutas recomendadas */}
        {(provinciaSeleccionada || mostrarTodas) && loadingRutas && (
          <div className="rutas-section">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando rutas...</p>
            </div>
          </div>
        )}

        {(provinciaSeleccionada || mostrarTodas) && !loadingRutas && rutasRecomendadas.length > 0 && (
          <div className="rutas-section">
            <h3>
              {mostrarTodas
                ? `Todas las rutas disponibles (${rutasRecomendadas.length} rutas)`
                : `Rutas desde ${provinciaSeleccionada} (${rutasRecomendadas.length} rutas disponibles)`
              }
            </h3>
            <div className="rutas-grid">
              {rutasRecomendadas.map((ruta, index) => (
                <div key={ruta.id || index} className="ruta-card">
                  <div className="ruta-header">
                    <div className="ruta-route">
                      <span className="ruta-origen">{ruta.origen}</span>
                      <span className="ruta-arrow">➜</span>
                      <span className="ruta-destino">{ruta.destino}</span>
                    </div>
                    <div className="ruta-precio">{ruta.precio}</div>
                  </div>
                  <div className="ruta-info">
                    <div className="ruta-item">
                      <span className="ruta-label">Asientos:</span>
                      <span className="ruta-value">{ruta.asientos}</span>
                    </div>
                    <div className="ruta-item">
                      <span className="ruta-label">Duración:</span>
                      <span className="ruta-value">{ruta.duracion}</span>
                    </div>
                    <div className="ruta-item">
                      <span className="ruta-label">Empresa:</span>
                      <span className="ruta-value">{ruta.empresa}</span>
                    </div>
                  </div>
                  <button
                    className="btn-ruta"
                    onClick={() => navigate(`/boletos?origen=${encodeURIComponent(ruta.origen)}&destino=${encodeURIComponent(ruta.destino)}`)}
                  >
                    Ver Boletos
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(provinciaSeleccionada || mostrarTodas) && !loadingRutas && rutasRecomendadas.length === 0 && (
          <div className="no-rutas">
            <p>
              {mostrarTodas
                ? 'No hay rutas disponibles en este momento.'
                : `No hay rutas disponibles para ${provinciaSeleccionada} en este momento.`
              }
            </p>
          </div>
        )}

        {!provinciaSeleccionada && !mostrarTodas && (
          <div className="no-rutas">
            <p>Por favor, selecciona una provincia o marca "Mostrar todas las rutas disponibles" para ver las rutas.</p>
          </div>
        )}
      </div>
    </div>
  );
}

