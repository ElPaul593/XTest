import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../services/users';
import { getProvinciaFromCedula, getProvinciaDeCiudad } from '../constants/provincias';
import { getRutas, getRutaById } from '../services/rutas';
import TripPlanner from '../components/TripPlanner';
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

function agruparPorProvincia(rutas, provinciaKey, ciudadKey) {
  const grupos = new Map();
  rutas.forEach((ruta) => {
    const provincia = ruta[provinciaKey];
    if (!provincia) return;
    if (!grupos.has(provincia)) grupos.set(provincia, new Set());
    grupos.get(provincia).add(ruta[ciudadKey]);
  });
  return grupos;
}

function ciudadesUnicas(rutas, ciudadKey) {
  return [...new Set(rutas.map((ruta) => ruta[ciudadKey]))].sort((a, b) => a.localeCompare(b, 'es'));
}

function coincide(ruta, { origen, destino, ciudadOrigen, ciudadDestino }) {
  return (!origen || ruta.provinciaOrigen === origen)
    && (!destino || ruta.provinciaDestino === destino)
    && (!ciudadOrigen || ruta.origen === ciudadOrigen)
    && (!ciudadDestino || ruta.destino === ciudadDestino);
}

// Fecha local: toISOString() usa UTC y en Ecuador daría "mañana" por la noche
const hoyLocal = () => new Date().toLocaleDateString('en-CA');

export default function Rutas() {
  // Desde Lugares se llega con el destino ya elegido
  const [searchParams] = useSearchParams();
  const destinoInicial = searchParams.get('destino') || '';
  const [loading, setLoading] = useState(true);
  const [loadingRutas, setLoadingRutas] = useState(true);
  const [errorRutas, setErrorRutas] = useState(false);
  const [loadingMapaId, setLoadingMapaId] = useState(null);
  const [provinciaOrigen, setProvinciaOrigen] = useState('');
  const [provinciaUsuario, setProvinciaUsuario] = useState('');
  const [provinciaDestino, setProvinciaDestino] = useState('');
  const [pasoActivo, setPasoActivo] = useState('origen');
  const [modo, setModo] = useState(destinoInicial ? 'rapida' : 'mapa');
  const [rutasBase, setRutasBase] = useState([]);
  const [ciudadOrigen, setCiudadOrigen] = useState('');
  const [ciudadDestino, setCiudadDestino] = useState(destinoInicial);
  const [rutaMapaSeleccionada, setRutaMapaSeleccionada] = useState(null);
  const [fechaViajeMapa, setFechaViajeMapa] = useState(hoyLocal());
  const [salidaPorRuta, setSalidaPorRuta] = useState({});
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

        // Si el usuario es ecuatoriano (tiene cédula), su provincia es la salida
        if (me.cedula) {
          const provincia = getProvinciaFromCedula(me.cedula);
          setProvinciaUsuario(provincia || '');
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

  useEffect(() => {
    getRutas()
      .then(setRutasBase)
      .catch((err) => {
        console.error('Error al cargar rutas:', err);
        setErrorRutas(true);
      })
      .finally(() => setLoadingRutas(false));
  }, []);

  const formatearObjRuta = (ruta) => ({
    id: ruta._id || ruta.id,
    origen: ruta.from,
    destino: ruta.to,
    provinciaOrigen: getProvinciaDeCiudad(ruta.from),
    provinciaDestino: getProvinciaDeCiudad(ruta.to),
    nombre: ruta.name,
    asientos: ruta.seats,
    precio: ruta.price ? `$${ruta.price}` : 'Consultar precio',
    duracion: ruta.duration || 'Consultar duración',
    horaSalida: ruta.horaSalida || '08:00',
    salidas: Array.isArray(ruta.salidas)
      ? ruta.salidas.filter((salida) => salida.activo !== false && salida.fecha && salida.horaSalida)
      : [],
    duracionEstimada: ruta.duracionEstimada || null,
    polyline: ruta.polyline || null,
    mapNoDisponible: ruta.mapNoDisponible || false,
    mapError: ruta.mapError || null,
    empresa: 'Varias empresas'
  });

  const todasLasRutas = useMemo(() => rutasBase.map(formatearObjRuta), [rutasBase]);

  // La búsqueda rápida ignora las provincias del mapa: solo filtra por ciudad
  const origen = modo === 'mapa' ? provinciaOrigen : '';
  const destino = modo === 'mapa' ? provinciaDestino : '';

  const opcionesProvincia = useMemo(() => ({
    origen: agruparPorProvincia(todasLasRutas, 'provinciaOrigen', 'origen'),
    destino: agruparPorProvincia(
      todasLasRutas.filter((ruta) => coincide(ruta, { origen })),
      'provinciaDestino',
      'destino'
    ),
  }), [todasLasRutas, origen]);

  const ciudadesSalida = ciudadesUnicas(todasLasRutas.filter((ruta) => coincide(ruta, { origen, destino })), 'origen');
  const ciudadesLlegada = ciudadesUnicas(
    todasLasRutas.filter((ruta) => coincide(ruta, { origen, destino, ciudadOrigen })),
    'destino'
  );

  const rutasMostradas = todasLasRutas.filter((ruta) =>
    coincide(ruta, { origen, destino, ciudadOrigen, ciudadDestino }));

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setCiudadOrigen('');
    setCiudadDestino('');
  };

  const seleccionarProvincia = (paso, provincia) => {
    setCiudadOrigen('');
    setCiudadDestino('');

    if (paso === 'origen') {
      setProvinciaOrigen(provincia);
      const destinoValido = !provincia || todasLasRutas.some((ruta) =>
        coincide(ruta, { origen: provincia, destino: provinciaDestino }));
      if (!destinoValido) setProvinciaDestino('');
      if (provincia) setPasoActivo('destino');
      return;
    }

    setProvinciaDestino(provincia);
    if (provincia && !provinciaOrigen) setPasoActivo('origen');
  };

  const abrirMapaRuta = async (ruta, salida = null) => {
    const rutaId = ruta.id || ruta._id;
    setLoadingMapaId(rutaId);
    try {
      const freshRuta = await getRutaById(rutaId);
      const rutaFormateada = formatearObjRuta(freshRuta);
      if (salida) {
        rutaFormateada.fechaSalida = salida.fecha;
        rutaFormateada.horaSalida = salida.horaSalida;
      }
      setRutaMapaSeleccionada(rutaFormateada);
      if (salida?.fecha) setFechaViajeMapa(salida.fecha);
    } catch (err) {
      console.error('Error al obtener datos frescos de la ruta:', err);
      setRutaMapaSeleccionada(salida ? { ...ruta, fechaSalida: salida.fecha, horaSalida: salida.horaSalida } : ruta);
      if (salida?.fecha) setFechaViajeMapa(salida.fecha);
    } finally {
      setLoadingMapaId(null);
    }
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

  const salidaTexto = ciudadOrigen || origen;
  const llegadaTexto = ciudadDestino || destino;
  const tituloResultados = salidaTexto || llegadaTexto
    ? `Rutas${salidaTexto ? ` desde ${salidaTexto}` : ''}${llegadaTexto ? ` hacia ${llegadaTexto}` : ''}`
    : 'Todas las rutas';

  const camposCiudad = (
    <>
      <div className="rutas-city-search__fields">
        <label>
          <span>Desde</span>
          <select value={ciudadOrigen} onChange={(e) => { setCiudadOrigen(e.target.value); setCiudadDestino(''); }}>
            <option value="">Cualquier ciudad</option>
            {ciudadesSalida.map((ciudad) => <option key={`origen-${ciudad}`} value={ciudad}>{ciudad}</option>)}
          </select>
        </label>
        <label>
          <span>Hasta</span>
          <select value={ciudadDestino} onChange={(e) => setCiudadDestino(e.target.value)}>
            <option value="">Cualquier ciudad</option>
            {ciudadesLlegada.map((ciudad) => <option key={`destino-${ciudad}`} value={ciudad}>{ciudad}</option>)}
          </select>
        </label>
      </div>
      {(ciudadOrigen || ciudadDestino) && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => { setCiudadOrigen(''); setCiudadDestino(''); }}
        >
          Limpiar
        </button>
      )}
    </>
  );

  const resultados = (
    <section className="rutas-resultados" aria-label="Viajes encontrados">
      {!loadingRutas && !errorRutas && (
        <h3>{tituloResultados} ({rutasMostradas.length})</h3>
      )}

      {loadingRutas && <p className="rutas-resultados__aviso">Cargando viajes...</p>}
      {errorRutas && (
        <p className="rutas-resultados__aviso">No pudimos cargar los viajes. Recarga la página para intentarlo de nuevo.</p>
      )}
      {!loadingRutas && !errorRutas && rutasMostradas.length === 0 && (
        <p className="rutas-resultados__aviso">No hay viajes con esa selección. Prueba con otra ciudad o provincia.</p>
      )}

      <div className="rutas-resultados__lista">
        {rutasMostradas.map((ruta) => (
          <article key={ruta.id} className="ruta-fila">
            {(() => {
              const salidas = ruta.salidas.length
                ? ruta.salidas
                : [{ fecha: fechaViajeMapa, horaSalida: ruta.horaSalida }];
              const salida = salidas.find((item) => item.fecha === salidaPorRuta[ruta.id]) || salidas[0];
              return (
                <>
            <div className="ruta-fila__info">
              <strong>{ruta.origen} ➜ {ruta.destino}</strong>
              <span>
                {ruta.salidas.length ? (
                  <label>
                    Salida:{' '}
                    <select
                      value={salida.fecha}
                      onChange={(event) => setSalidaPorRuta((current) => ({ ...current, [ruta.id]: event.target.value }))}
                      aria-label={`Salida de ${ruta.origen} a ${ruta.destino}`}
                    >
                      {salidas.map((item) => <option key={`${item.fecha}-${item.horaSalida}`} value={item.fecha}>{item.fecha} · {item.horaSalida}</option>)}
                    </select>
                  </label>
                ) : `${salida.fecha} · ${salida.horaSalida}`} · {ruta.duracion} · {ruta.asientos} asientos
              </span>
              <span className="ruta-fila__enlaces">
                <Link to={`/destino?ciudad=${encodeURIComponent(ruta.destino)}`}>Hoteles y lugares</Link>
                <Link to={`/recomendados?ciudad=${encodeURIComponent(ruta.destino)}`}>Recomendados</Link>
              </span>
            </div>
            <span className="ruta-fila__precio">{ruta.precio}</span>
            <div className="ruta-fila__acciones">
              <button
                type="button"
                className="ruta-fila__btn ruta-fila__btn--principal"
                disabled={!salida?.fecha}
                title={salida?.fecha ? undefined : 'Esta ruta no tiene una salida programada'}
                onClick={() => navigate(`/seat-booking?ruta=${encodeURIComponent(ruta.id)}&fecha=${encodeURIComponent(salida.fecha)}&hora=${encodeURIComponent(salida.horaSalida)}`)}
              >
                Elegir
              </button>
              <button
                type="button"
                className="ruta-fila__btn"
                onClick={() => abrirMapaRuta(ruta, salida)}
                disabled={loadingMapaId === ruta.id}
              >
                {loadingMapaId === ruta.id ? '...' : 'Ver trayecto'}
              </button>
            </div>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className="rutas-container">
      <div className="container">
        <div className="rutas-header">
          <h1>Comprar boletos</h1>
          {provinciaUsuario && (
            <div className="rutas-welcome" role="status">
              <strong>¡Bienvenido ciudadano de la provincia de {provinciaUsuario}!</strong>
              <span>Explora las rutas disponibles para tu viaje.</span>
            </div>
          )}
          <div className="compra-barra">
            <div className="compra-modos" role="group" aria-label="Forma de buscar">
              <button type="button" aria-pressed={modo === 'mapa'} onClick={() => cambiarModo('mapa')}>Con mapa</button>
              <button type="button" aria-pressed={modo === 'rapida'} onClick={() => cambiarModo('rapida')}>Búsqueda rápida</button>
            </div>
            <label className="compra-fecha">
              <span>Fecha</span>
              <input
                type="date"
                value={fechaViajeMapa}
                min={hoyLocal()}
                onChange={(e) => setFechaViajeMapa(e.target.value)}
              />
            </label>
          </div>
        </div>

        {modo === 'mapa' ? (
          <TripPlanner
            origen={provinciaOrigen}
            destino={provinciaDestino}
            paso={pasoActivo}
            opciones={opcionesProvincia}
            onPasoChange={setPasoActivo}
            onSelect={seleccionarProvincia}
          >
            <details className="rutas-city-search">
              <summary className="rutas-city-search__title">Buscar por ciudad</summary>
              {camposCiudad}
            </details>
            {resultados}
          </TripPlanner>
        ) : (
          <div className="compra-rapida">
            <div className="rutas-city-search">{camposCiudad}</div>
            {resultados}
          </div>
        )}

        {rutaMapaSeleccionada && (
          <div className="ruta-map-modal" role="dialog" aria-modal="true" aria-label="Mapa del trayecto">
            <div className="rutas-section ruta-map-section">
            <h3>Mapa del trayecto</h3>
            <div className="ruta-map-panel">
              <div className="ruta-map-controls">
                <div className="ruta-map-meta">
                  <strong>{rutaMapaSeleccionada.origen} → {rutaMapaSeleccionada.destino}</strong>
                  <span>Duración estimada: {
                    typeof rutaMapaSeleccionada.duracionEstimada === 'number' && Number.isFinite(rutaMapaSeleccionada.duracionEstimada)
                      ? `${Math.floor(rutaMapaSeleccionada.duracionEstimada / 3600) > 0 ? `${Math.floor(rutaMapaSeleccionada.duracionEstimada / 3600)} h ` : ''}${Math.round((rutaMapaSeleccionada.duracionEstimada % 3600) / 60)} min`
                      : rutaMapaSeleccionada.duracion
                  }</span>
                </div>
                <label className="ruta-map-input">
                  <span>Fecha del viaje</span>
                  <input
                    id="ruta-map-fecha"
                    type="date"
                    min={hoyLocal()}
                    value={fechaViajeMapa}
                    disabled={Boolean(rutaMapaSeleccionada.salidas?.length)}
                    title={rutaMapaSeleccionada.salidas?.length ? 'La fecha pertenece a la salida programada seleccionada' : undefined}
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
          </div>
        )}
      </div>
    </div>
  );
}
