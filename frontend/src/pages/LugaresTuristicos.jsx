import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getLugaresTuristicos } from '../services/lugaresTuristicos';
import { REGIONES, getProvinciaDeCiudad } from '../constants/provincias';
import Icon from '../components/Icon';

const LUGARES_POR_TANDA = 12;

function normalizarTexto(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function getRegionId(ciudad) {
  const provincia = getProvinciaDeCiudad(ciudad);
  return REGIONES.find((region) => region.provincias.includes(provincia))?.id || null;
}

function formatearPrecio(precio) {
  return typeof precio === 'number' && precio > 0 ? `$${precio}` : 'Gratis';
}

// Wikimedia entrega originales de hasta 6000 px; se pide una versión ligera
function getImagenLigera(url, ancho) {
  if (!url.includes('Special:FilePath') || url.includes('width=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}width=${ancho}`;
}

function LugarImagen({ lugar, ancho = 640 }) {
  const [fallo, setFallo] = useState(false);

  if (!lugar.imagen || fallo) {
    return <div className="lugar-sin-imagen" aria-hidden="true"><Icon name="landscape" size={40} /></div>;
  }

  return (
    <img
      src={getImagenLigera(lugar.imagen, ancho)}
      alt={lugar.nombre}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFallo(true)}
    />
  );
}

function LugarDetalle({ lugar, onClose }) {
  useEffect(() => {
    const cerrarConEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [onClose]);

  const ciudad = encodeURIComponent(lugar.ciudad);

  return createPortal(
    <div className="lugar-detalle" role="dialog" aria-modal="true" aria-label={lugar.nombre} onClick={onClose}>
      <div className="lugar-detalle__caja" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lugar-detalle__cerrar" aria-label="Cerrar" onClick={onClose}><Icon name="x" size={18} /></button>
        <div className="lugar-detalle__imagen"><LugarImagen lugar={lugar} ancho={1000} /></div>
        <div className="lugar-detalle__cuerpo">
          <p className="lugar-ciudad">{lugar.ciudad}</p>
          <h2>{lugar.nombre}</h2>
          {lugar.descripcion && <p>{lugar.descripcion}</p>}
          <dl>
            <div><dt>Entrada</dt><dd>{formatearPrecio(lugar.precioEntrada)}</dd></div>
            {lugar.tipo && <div><dt>Tipo</dt><dd>{lugar.tipo}</dd></div>}
            {lugar.horario && <div><dt>Horario</dt><dd>{lugar.horario}</dd></div>}
            {lugar.direccion && <div><dt>Dirección</dt><dd>{lugar.direccion}</dd></div>}
          </dl>
          <div className="lugar-detalle__acciones">
            <Link className="btn btn-primary" to={`/boletos?destino=${ciudad}`}>Viajar a {lugar.ciudad}</Link>
            <Link className="btn btn-secondary" to={`/destino?ciudad=${ciudad}`}>Hoteles y lugares</Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LugaresTuristicos() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [region, setRegion] = useState('');
  const [tipo, setTipo] = useState('');
  const [visibles, setVisibles] = useState(LUGARES_POR_TANDA);
  const [lugarAbierto, setLugarAbierto] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getLugaresTuristicos();
        setLugares(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tipos = useMemo(
    () => [...new Set(lugares.map((l) => l.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [lugares]
  );

  const regiones = useMemo(() => {
    const conLugares = new Set(lugares.map((l) => getRegionId(l.ciudad)));
    return REGIONES.filter((r) => conLugares.has(r.id));
  }, [lugares]);

  const lugaresFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    return lugares.filter((lugar) =>
      (!region || getRegionId(lugar.ciudad) === region)
      && (!tipo || lugar.tipo === tipo)
      && (!texto
        || normalizarTexto(lugar.nombre).includes(texto)
        || normalizarTexto(lugar.ciudad).includes(texto)));
  }, [lugares, busqueda, region, tipo]);

  const hayFiltros = Boolean(busqueda || region || tipo);

  const aplicarFiltro = (setter) => (valor) => {
    setVisibles(LUGARES_POR_TANDA);
    setter(valor);
  };
  const cambiarBusqueda = aplicarFiltro(setBusqueda);
  const cambiarRegion = aplicarFiltro(setRegion);
  const cambiarTipo = aplicarFiltro(setTipo);

  const limpiarFiltros = () => {
    setVisibles(LUGARES_POR_TANDA);
    setBusqueda('');
    setRegion('');
    setTipo('');
  };

  return (
    <div className="lugares-container">
      <div className="container">
        <div className="lugares-header">
          <h1>Lugares turísticos</h1>
          <p>Descubre qué visitar en Ecuador</p>
        </div>

        <div className="lugares-filtros">
          <input
            className="input"
            type="search"
            aria-label="Buscar un lugar o ciudad"
            placeholder="Busca un lugar o ciudad"
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
          />
          <select aria-label="Tipo de lugar" value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {tipos.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
          </select>
          <div className="lugares-regiones" role="group" aria-label="Región">
            <button type="button" aria-pressed={!region} onClick={() => cambiarRegion('')}>Todas</button>
            {regiones.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={region === opcion.id}
                onClick={() => cambiarRegion(opcion.id)}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando lugares turísticos...</p>
          </div>
        ) : (
          <>
            <div className="lugares-total">
              <span>{lugaresFiltrados.length} {lugaresFiltrados.length === 1 ? 'lugar' : 'lugares'}</span>
              {hayFiltros && <button type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
            </div>

            {lugaresFiltrados.length === 0 ? (
              <div className="no-rutas">
                <p>No encontramos lugares con esa búsqueda.</p>
              </div>
            ) : (
              <div className="lugares-grid">
                {lugaresFiltrados.slice(0, visibles).map((lugar) => (
                  <button
                    key={lugar._id || `${lugar.nombre}-${lugar.ciudad}`}
                    type="button"
                    className="lugar-card"
                    onClick={() => setLugarAbierto(lugar)}
                  >
                    <div className="lugar-imagen-wrap">
                      <LugarImagen lugar={lugar} />
                      <span className="lugar-precio">{formatearPrecio(lugar.precioEntrada)}</span>
                    </div>
                    <div className="lugar-contenido">
                      <p className="lugar-ciudad">{lugar.ciudad}{lugar.tipo ? ` · ${lugar.tipo}` : ''}</p>
                      <h3>{lugar.nombre}</h3>
                      {lugar.descripcion && <p className="lugar-descripcion">{lugar.descripcion}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {lugaresFiltrados.length > visibles && (
              <div className="lugares-mas">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setVisibles((valor) => valor + LUGARES_POR_TANDA)}
                >
                  Ver más lugares
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lugarAbierto && <LugarDetalle lugar={lugarAbierto} onClose={() => setLugarAbierto(null)} />}
    </div>
  );
}
