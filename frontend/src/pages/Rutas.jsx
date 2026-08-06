import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/users';
import { getProvinciaFromCedula } from '../constants/provincias';
import { getRutasPorProvincia, getRutas } from '../services/rutas';
import EcuadorMapSelector from '../components/EcuadorMapSelector';
import RouteMap from '../components/RouteMap';

function combineDateAndTime(fecha, horaSalida) {
  if (!fecha || !horaSalida) return null;
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = horaSalida.split(':').map(Number);
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function parseDurationToMinutes(duration) {
  if (!duration) return null;
  const text = String(duration).trim().toLowerCase();
  const compact = text.split(' ').join('');
  let splitAt = -1;

  for (let index = 0; index < compact.length; index += 1) {
    const char = compact[index];
    const isNumeric = char >= '0' && char <= '9';
    const isDecimalSeparator = char === '.' || char === ',';
    if (!isNumeric && !isDecimalSeparator) {
      splitAt = index;
      break;
    }
  }

  if (splitAt <= 0) return null;

  const value = Number(compact.slice(0, splitAt).replace(',', '.'));
  if (Number.isNaN(value)) return null;

  const unit = compact.slice(splitAt);
  if (unit.startsWith('h')) return value * 60;
  if (unit.startsWith('m')) return value;
  return null;
}

function formatDateTime(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getRouteDurationMinutes(ruta) {
  if (typeof ruta.duracionEstimada === 'number' && Number.isFinite(ruta.duracionEstimada)) {
    return ruta.duracionEstimada / 60;
  }
  return parseDurationToMinutes(ruta.duration);
}

export default function Rutas() {
  const [loading, setLoading] = useState(true);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [user, setUser] = useState(null);
  const [provinciaUsuario, setProvinciaUsuario] = useState(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [rutasRecomendadas, setRutasRecomendadas] = useState([]);
  const [rutaMapaSeleccionada, setRutaMapaSeleccionada] = useState(null);
  const [fechaViajeMapa, setFechaViajeMapa] = useState(new Date().toISOString().slice(0, 10));
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
      horaSalida: ruta.horaSalida || '08:00',
      duracionEstimada: ruta.duracionEstimada || null,
      polyline: ruta.polyline || null,
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

  const abrirMapaRuta = (ruta) => {
    setRutaMapaSeleccionada(ruta);
    setFechaViajeMapa((currentValue) => currentValue || new Date().toISOString().slice(0, 10));
  };

  const fechaSalidaReal = rutaMapaSeleccionada
    ? combineDateAndTime(fechaViajeMapa, rutaMapaSeleccionada.horaSalida || '08:00')
    : null;

  const fechaLlegadaReal = fechaSalidaReal && rutaMapaSeleccionada
    ? new Date(fechaSalidaReal.getTime() + (getRouteDurationMinutes(rutaMapaSeleccionada) || 0) * 60 * 1000)
    : null;

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
              <div style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                Selecciona una provincia para ver rutas recomendadas:
              </div>
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
                      <span className="ruta-label">Salida:</span>
                      <span className="ruta-value">{ruta.horaSalida}</span>
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
                  <button
                    className="btn-ruta btn-ruta-secondary"
                    onClick={() => abrirMapaRuta(ruta)}
                    style={{ marginTop: '10px' }}
                  >
                    Ver mapa del trayecto
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {rutaMapaSeleccionada && (
          <div className="rutas-section ruta-map-section">
            <h3>Mapa del trayecto</h3>
            <div className="ruta-map-panel">
              <div className="ruta-map-controls">
                <div className="ruta-map-meta">
                  <strong>{rutaMapaSeleccionada.origen} → {rutaMapaSeleccionada.destino}</strong>
                  <span>Duración estimada: {rutaMapaSeleccionada.duracion}</span>
                </div>
                <label className="ruta-map-input">
                  <span>Fecha del viaje</span>
                  <input
                    id="ruta-map-fecha"
                    type="date"
                    value={fechaViajeMapa}
                    onChange={(e) => setFechaViajeMapa(e.target.value)}
                  />
                </label>
                <div className="ruta-map-arrival">
                  <span>Salida programada</span>
                  <strong>{rutaMapaSeleccionada.horaSalida || '08:00'}</strong>
                </div>
                <div className="ruta-map-arrival">
                  <span>Llegada estimada</span>
                  <strong>
                    {fechaLlegadaReal
                      ? formatDateTime(fechaLlegadaReal)
                      : 'Consultar duración'}
                  </strong>
                </div>
                <button
                  className="btn-ruta btn-ruta-secondary"
                  onClick={() => setRutaMapaSeleccionada(null)}
                >
                  Cerrar mapa
                </button>
              </div>

              <RouteMap
                origen={rutaMapaSeleccionada.origen}
                destino={rutaMapaSeleccionada.destino}
                polyline={rutaMapaSeleccionada.polyline}
                fechaSalida={fechaSalidaReal ? fechaSalidaReal.toISOString() : null}
                fechaLlegadaEstimada={fechaLlegadaReal ? fechaLlegadaReal.toISOString() : null}
              />
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

