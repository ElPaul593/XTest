import React from 'react';
import { REGIONES } from '../constants/provincias';
import EcuadorMapSelector from './EcuadorMapSelector';

const PASOS = [
  { id: 'origen', numero: 'A', titulo: 'Salgo de', vacio: 'Provincia' },
  { id: 'destino', numero: 'B', titulo: 'Voy a', vacio: 'Provincia' }
];

function resumirCiudades(ciudades) {
  const lista = [...ciudades].slice(0, 3).join(', ');
  return ciudades.size > 3 ? `${lista}…` : lista;
}

function getGuia({ origen, destino, paso, opciones }) {
  if (origen && destino) return 'Listo. Mira tus rutas abajo.';
  if (paso === 'origen') return 'Toca en el mapa de dónde sales.';
  if (origen && opciones.size === 0) return `No hay rutas desde ${origen}. Elige otra provincia.`;
  return 'Ahora toca en el mapa a dónde vas.';
}

/**
 * Guía al usuario para elegir origen y destino. El mapa y las listas comparten el
 * mismo estado: elegir en uno se refleja en el otro.
 *
 * `opciones` tiene, por paso, un Map provincia → Set de ciudades con rutas.
 */
export default function TripPlanner({ origen, destino, paso, opciones, onPasoChange, onSelect, children }) {
  const valores = { origen, destino };
  const opcionesPaso = opciones[paso];

  return (
    <div className="trip-planner">
      <div className="trip-planner__panel">
        <p className="trip-planner__guide" role="status">
          {getGuia({ origen, destino, paso, opciones: opcionesPaso })}
        </p>

        <div className="trip-planner__steps">
        {PASOS.map(({ id, numero, titulo, vacio }) => (
          <div
            key={id}
            className={`trip-step trip-step--${id}${paso === id ? ' trip-step--active' : ''}`}
          >
            <button type="button" className="trip-step__head" onClick={() => onPasoChange(id)}>
              <span className="trip-step__badge" aria-hidden="true">{numero}</span>
              <span>{titulo}</span>
            </button>
            <div className="trip-step__field">
              <select
                aria-label={titulo}
                value={valores[id]}
                onFocus={() => onPasoChange(id)}
                onChange={(e) => onSelect(id, e.target.value)}
              >
                <option value="">{vacio}</option>
                {REGIONES.map((region) => (
                  <optgroup key={region.id} label={region.nombre}>
                    {region.provincias.map((provincia) => {
                      const ciudades = opciones[id].get(provincia);
                      return (
                        <option key={provincia} value={provincia} disabled={!ciudades}>
                          {ciudades
                            ? `${provincia} (${resumirCiudades(ciudades)})`
                            : `${provincia} (sin rutas)`}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
              {valores[id] && (
                <button
                  type="button"
                  className="trip-step__clear"
                  aria-label={`Quitar ${valores[id]}`}
                  onClick={() => onSelect(id, '')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        </div>

        {children}
      </div>

      <EcuadorMapSelector
        origin={origen}
        destination={destino}
        activeStep={paso}
        available={opcionesPaso}
        onSelect={(provincia) => onSelect(paso, provincia === valores[paso] ? '' : provincia)}
      />
    </div>
  );
}
