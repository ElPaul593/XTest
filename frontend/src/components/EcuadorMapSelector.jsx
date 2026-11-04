import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

/**
 * Mapa interactivo real de Ecuador con las 24 provincias.
 * Usa react-simple-maps + GeoJSON geográfico preciso.
 *
 * Props:
 *   origin       – provincia de salida (marca A)
 *   destination  – provincia de destino (marca B)
 *   activeStep   – 'origen' | 'destino': qué se está eligiendo
 *   available    – Map provincia → Set de ciudades con rutas para ese paso
 *   onSelect     – callback(nombre) al hacer clic en una provincia disponible
 *   disabled     – boolean para deshabilitar interacción
 */

/**
 * #31BUG — Archivo de datos duplicado: 655 KB que se publican dos veces.
 *
 * El mismo GeoJSON existe en dos rutas, IDÉNTICAS byte a byte (670 788 bytes
 * cada una, verificado con `cmp`):
 *
 *   · `frontend/public/ecuador-provinces.geojson`     ← el que se usa
 *   · `frontend/src/assets/ecuador-provinces.geojson` ← copia muerta
 *
 * Esta constante apunta a `/ecuador-provinces.geojson`, es decir, a la copia de
 * `public/`, que Vite sirve tal cual en la raíz del sitio. La copia de
 * `src/assets/` no la importa nadie (0 referencias en todo `src/`), así que no
 * entra en el bundle pero sí ocupa espacio en el repositorio y en cada clon.
 *
 * El riesgo es la divergencia silenciosa: si se corrige la geometría de una
 * provincia en la copia equivocada, el mapa no cambia y el error es difícil de
 * localizar, porque ambos archivos tienen el mismo nombre.
 *
 * La anotación va aquí porque el formato JSON no admite comentarios.
 *
 * NO se corrige por indicación expresa: solo se documenta. La copia viva es la
 * de `public/`.
 */
const GEO_URL = '/ecuador-provinces.geojson';

// ── Colores por región ─────────────────────────────────────────────────────
const REGION_MAP = {
  sierra: {
    provinces: [
      'Carchi','Imbabura','Pichincha','Santo Domingo de los Tsáchilas',
      'Cotopaxi','Tungurahua','Chimborazo','Bolívar','Cañar','Azuay','Loja',
    ],
    base:     '#3B82F6',
    hover:    '#2563EB',
    selected: '#1D4ED8',
    badge:    '#DBEAFE',
  },
  costa: {
    provinces: ['Esmeraldas','Manabí','Los Ríos','Guayas','El Oro','Santa Elena'],
    base:     '#10B981',
    hover:    '#059669',
    selected: '#047857',
    badge:    '#D1FAE5',
  },
  amazonia: {
    provinces: [
      'Sucumbíos','Napo','Orellana','Pastaza',
      'Morona Santiago','Zamora Chinchipe',
    ],
    base:     '#F59E0B',
    hover:    '#D97706',
    selected: '#B45309',
    badge:    '#FEF3C7',
  },
  galapagos: {
    provinces: ['Galápagos'],
    base:     '#8B5CF6',
    hover:    '#7C3AED',
    selected: '#6D28D9',
    badge:    '#EDE9FE',
  },
};

// Mapa plano: nombre → región
const PROVINCE_TO_REGION = {};
for (const [region, data] of Object.entries(REGION_MAP)) {
  for (const p of data.provinces) PROVINCE_TO_REGION[p] = region;
}

// Normaliza el nombre que viene del GeoJSON
function normalizeName(raw = '') {
  const map = {
    'Santo Domingo de los Tsachilas': 'Santo Domingo de los Tsáchilas',
    'Santo Domingo de los Tsáchilas': 'Santo Domingo de los Tsáchilas',
    'Morona-Santiago': 'Morona Santiago',
    'Zamora-Chinchipe': 'Zamora Chinchipe',
    'Los Rios': 'Los Ríos',
    'Bolivar': 'Bolívar',
    'Galapagos': 'Galápagos',
    'Cañar': 'Cañar',
    'Santo Domingo': 'Santo Domingo de los Tsáchilas',
  };
  return map[raw] || raw;
}

const MARKS = {
  origin: { fill: '#FFD60A', ink: '#0B0B0D', letter: 'A' },
  destination: { fill: '#EC4899', ink: '#FFFFFF', letter: 'B' },
};

function getColors(nombre) {
  const region = PROVINCE_TO_REGION[nombre] || 'amazonia';
  return REGION_MAP[region];
}

// ── Componente principal ───────────────────────────────────────────────────
export default function EcuadorMapSelector({
  origin = '',
  destination = '',
  activeStep = 'origen',
  available,
  onSelect,
  disabled = false,
}) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: '' });
  const [geoData, setGeoData] = useState(null);

  // Cargar GeoJSON local
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const isAvailable = (nombre) => !available || available.has(nombre);
  const getMark = (nombre) => {
    if (nombre === destination && activeStep === 'destino') return MARKS.destination;
    if (nombre === origin) return MARKS.origin;
    return nombre === destination ? MARKS.destination : null;
  };

  const handleClick = (nombre) => {
    if (disabled || !isAvailable(nombre)) return;
    onSelect(nombre);
  };

  const handleMouseEnter = (e, nombre) => {
    if (disabled) return;
    setHovered(nombre);
    const rect = e.target.getBoundingClientRect();
    const parent = e.target.closest('[data-map-root]')?.getBoundingClientRect();
    if (parent) {
      setTooltip({
        visible: true,
        x: rect.left - parent.left + rect.width / 2,
        y: rect.top  - parent.top,
        name: nombre,
      });
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setTooltip(t => ({ ...t, visible: false }));
  };

  // Determinar colores de fill / stroke de cada provincia
  const getFill = (nombre) => {
    const c = getColors(nombre);
    const mark = getMark(nombre);
    if (mark) return mark.fill;
    if (hovered === nombre && isAvailable(nombre)) return c.hover;
    return c.base;
  };

  const getStroke = (nombre) => {
    if (getMark(nombre)) return '#FFFFFF';
    if (hovered === nombre && isAvailable(nombre)) return '#E2E8F0';
    return '#0F172A';
  };

  const getStrokeWidth = (nombre) => {
    if (getMark(nombre)) return 1.5;
    if (hovered === nombre && isAvailable(nombre)) return 1;
    return 0.3;
  };

  const tooltipCities = available?.get(tooltip.name);
  const tooltipDetail = available
    ? tooltipCities ? [...tooltipCities].slice(0, 3).join(', ') : 'Sin rutas'
    : '';

  const hintText = () => {
    if (hovered && !isAvailable(hovered)) {
      return activeStep === 'destino' && origin
        ? `No hay rutas de ${origin} a ${hovered}`
        : `${hovered} no tiene rutas disponibles`;
    }
    return hovered || 'Toca una provincia';
  };

  return (
    <div className="ecuador-map" style={styles.wrapper}>
      {/* ── Leyenda ────────────────────────────────────────────── */}
      <div style={styles.legend}>
        {Object.entries({
          Sierra: 'sierra',
          Costa: 'costa',
          Amazonía: 'amazonia',
          Galápagos: 'galapagos',
        }).map(([label, key]) => (
          <div key={key} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: REGION_MAP[key].base }} />
            <span style={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Mapa SVG ───────────────────────────────────────────── */}
      <div style={styles.mapContainer} data-map-root="">
        {/* Tooltip flotante */}
        {tooltip.visible && !disabled && (
          <div
            style={{
              ...styles.tooltip,
              left: tooltip.x,
              top: Math.max(0, tooltip.y - 48),
            }}
            aria-hidden="true"
          >
            {tooltip.name}
            {tooltipDetail && <span style={styles.tooltipDetail}>{tooltipDetail}</span>}
          </div>
        )}

        {geoData ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [-78.2, -1.5],
              scale: 2800,
            }}
            width={400}
            height={430}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
              <Geographies geography={geoData}>
                {({ geographies, path }) => (
                  <>
                    {geographies.map((geo) => {
                      const raw   = geo.properties.province || geo.properties.name || '';
                      const nombre = normalizeName(raw);
                      const isMarked = Boolean(getMark(nombre));
                      const enabled = isAvailable(nombre);
                      const cursor = disabled ? 'default' : enabled ? 'pointer' : 'not-allowed';
                      const baseStyle = {
                        fill:         getFill(nombre),
                        fillOpacity:  enabled || isMarked ? 1 : 0.2,
                        stroke:       getStroke(nombre),
                        strokeWidth:  getStrokeWidth(nombre),
                        outline:      'none',
                        cursor,
                        transition:   'fill 0.18s ease, stroke 0.18s ease, fill-opacity 0.18s ease',
                        filter: isMarked
                          ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
                          : 'none',
                      };

                      return (
                        <Geography
                          key={geo.rsmKey || nombre}
                          geography={geo}
                          onClick={() => handleClick(nombre)}
                          onMouseEnter={(e) => handleMouseEnter(e, nombre)}
                          onMouseLeave={handleMouseLeave}
                          tabIndex={disabled || !enabled ? -1 : 0}
                          onKeyDown={(e) => e.key === 'Enter' && handleClick(nombre)}
                          aria-label={`Provincia de ${nombre}${isMarked ? ' (seleccionada)' : ''}`}
                          aria-pressed={isMarked}
                          aria-disabled={!enabled}
                          role="button"
                          style={{ default: baseStyle, hover: baseStyle, pressed: baseStyle }}
                        />
                      );
                    })}

                    {/* Marcas A/B: si origen y destino coinciden se separan */}
                    {[[origin, MARKS.origin, -11], [destination, MARKS.destination, 11]].map(([nombre, mark, offset]) => {
                      if (!nombre) return null;
                      const geo = geographies.find((g) =>
                        normalizeName(g.properties.province || g.properties.name || '') === nombre);
                      if (!geo) return null;
                      const [x, y] = path.centroid(geo);
                      const dx = origin === destination ? offset : 0;
                      return (
                        <g key={mark.letter} transform={`translate(${x + dx},${y})`} style={{ pointerEvents: 'none' }}>
                          <circle r="10" fill={mark.fill} stroke="#FFFFFF" strokeWidth="1.5" />
                          <text textAnchor="middle" dy="4" fontSize="12" fontWeight="700" fill={mark.ink}>
                            {mark.letter}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </Geographies>
          </ComposableMap>
        ) : (
          <div style={styles.loadingMap}>
            <div style={styles.mapSpinner} />
            <span style={{ color: '#64748B', fontSize: '12px' }}>Cargando mapa…</span>
          </div>
        )}
      </div>

      {/* ── Hint inferior ──────────────────────────────────────── */}
      <div style={styles.hint}>
        {hintText()}
      </div>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    borderRadius: '16px',
    border: '1px solid #334155',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  legend: {
    display: 'flex',
    gap: '14px',
    padding: '8px 16px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #1E293B',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    flexShrink: 0,
  },
  legendLabel: {
    color: '#94A3B8',
    fontSize: '11px',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    minHeight: 0,
    padding: '8px',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    background: '#0B1220',
  },
  tooltip: {
    position: 'absolute',
    background: '#0F172A',
    color: '#F1F5F9',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #475569',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 10,
    transform: 'translateX(-50%)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  tooltipDetail: {
    display: 'block',
    color: '#CBD5E1',
    fontWeight: '400',
  },
  loadingMap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    gap: '12px',
  },
  mapSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #1E293B',
    borderTop: '3px solid #3B82F6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  hint: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
    padding: '8px 16px 12px',
    minHeight: '32px',
    transition: 'color 0.2s',
  },
};
