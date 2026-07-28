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
 *   value    – nombre de la provincia seleccionada (string)
 *   onChange – callback(nombre) cuando se selecciona / deselecciona
 *   disabled – boolean para deshabilitar interacción
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

function getColors(nombre) {
  const region = PROVINCE_TO_REGION[nombre] || 'amazonia';
  return REGION_MAP[region];
}

// ── Componente principal ───────────────────────────────────────────────────
export default function EcuadorMapSelector({ value, onChange, disabled = false }) {
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

  const handleClick = (nombre) => {
    if (disabled) return;
    onChange(value === nombre ? '' : nombre);
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

  const handleClear = () => { if (!disabled) onChange(''); };

  // Determinar colores de fill / stroke de cada provincia
  const getFill = (nombre) => {
    const c = getColors(nombre);
    if (value === nombre)   return c.selected;
    if (hovered === nombre) return c.hover;
    return c.base;
  };

  const getStroke = (nombre) => {
    if (value === nombre)   return '#FFFFFF';
    if (hovered === nombre) return '#E2E8F0';
    return '#0F172A';
  };

  const getStrokeWidth = (nombre) => {
    if (value === nombre)   return 1.5;
    if (hovered === nombre) return 1;
    return 0.3;
  };

  return (
    <div style={styles.wrapper}>
      {/* ── Status bar ─────────────────────────────────────────── */}
      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.pinIcon}>📍</span>
          {value
            ? <span style={styles.selectedText}>{value}</span>
            : <span style={styles.placeholderText}>Seleccione una provincia en el mapa</span>
          }
        </div>
        {value && (
          <button
            onClick={handleClear}
            style={styles.clearBtn}
            title="Limpiar selección"
            aria-label="Deseleccionar provincia"
          >
            ✕
          </button>
        )}
      </div>

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
              top: tooltip.y - 36,
            }}
            aria-hidden="true"
          >
            {tooltip.name}
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
            height={520}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const raw   = geo.properties.province || geo.properties.name || '';
                    const nombre = normalizeName(raw);
                    const isSelected = value === nombre;
                    const isHovered  = hovered === nombre;

                    return (
                      <Geography
                        key={geo.rsmKey || nombre}
                        geography={geo}
                        onClick={() => handleClick(nombre)}
                        onMouseEnter={(e) => handleMouseEnter(e, nombre)}
                        onMouseLeave={handleMouseLeave}
                        tabIndex={disabled ? -1 : 0}
                        onKeyDown={(e) => e.key === 'Enter' && handleClick(nombre)}
                        aria-label={`Provincia de ${nombre}${isSelected ? ' (seleccionada)' : ''}`}
                        aria-pressed={isSelected}
                        role="button"
                        style={{
                          default: {
                            fill:         getFill(nombre),
                            stroke:       getStroke(nombre),
                            strokeWidth:  getStrokeWidth(nombre),
                            outline:      'none',
                            cursor:       disabled ? 'default' : 'pointer',
                            transition:   'fill 0.18s ease, stroke 0.18s ease',
                            filter: isSelected
                              ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
                              : 'none',
                          },
                          hover: {
                            fill:        getColors(nombre).hover,
                            stroke:      '#E2E8F0',
                            strokeWidth: 1,
                            outline:     'none',
                            cursor:      disabled ? 'default' : 'pointer',
                          },
                          pressed: {
                            fill:    getColors(nombre).selected,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
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
        {hovered && hovered !== value
          ? `Clic para seleccionar ${hovered}`
          : value
          ? `Provincia seleccionada · clic nuevamente para deseleccionar`
          : 'Haz clic sobre una provincia del mapa para filtrar rutas'}
      </div>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    maxWidth: '420px',
    marginTop: '8px',
    margin: '8px auto 0',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    borderRadius: '16px',
    border: '1px solid #334155',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid #1E293B',
    minHeight: '48px',
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pinIcon: { fontSize: '16px' },
  selectedText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: '14px',
    letterSpacing: '0.02em',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  clearBtn: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#F87171',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    lineHeight: 1,
    padding: 0,
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
    color: '#475569',
    fontSize: '11px',
    padding: '8px 16px 12px',
    minHeight: '32px',
    transition: 'color 0.2s',
  },
};
