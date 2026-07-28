import React, { useEffect, useMemo, useState } from 'react';
import { getLugaresTuristicos } from '../services/lugaresTuristicos';

function normalizarTexto(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function LugaresTuristicos() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCiudad, setFiltroCiudad] = useState('');

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

  const ciudadesDisponibles = useMemo(() => {
    const setCiudades = new Set(lugares.map((l) => l.ciudad).filter(Boolean));
    return Array.from(setCiudades).sort((a, b) => a.localeCompare(b, 'es'));
  }, [lugares]);

  const lugaresFiltrados = useMemo(() => {
    const filtro = normalizarTexto(filtroCiudad);
    if (!filtro) return lugares;

    return lugares.filter((lugar) => {
      const ciudad = normalizarTexto(lugar.ciudad);
      return ciudad.includes(filtro);
    });
  }, [lugares, filtroCiudad]);

  return (
    <div className="lugares-container">
      <div className="container">
        <div className="lugares-header">
          <h1>Lugares Turísticos</h1>
          <p>Busca por ciudad y encuentra todos los atractivos disponibles.</p>
        </div>

        <div className="lugares-filtros">
          <label htmlFor="filtro-ciudad">Buscar ciudad</label>
          <input
            id="filtro-ciudad"
            className="input"
            type="text"
            placeholder="Ejemplo: Quito, Limon, Guayaquil..."
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
          />

          <div className="ciudades-lista" aria-label="Ciudades disponibles">
            {ciudadesDisponibles.map((ciudad) => (
              <button
                key={ciudad}
                type="button"
                className={`ciudad-chip ${normalizarTexto(filtroCiudad) === normalizarTexto(ciudad) ? 'active' : ''}`}
                onClick={() => setFiltroCiudad(ciudad)}
              >
                {ciudad}
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
            <p className="lugares-total">
              {lugaresFiltrados.length} lugar(es)
              {filtroCiudad ? ` en ${filtroCiudad}` : ' en total'}
            </p>

            {lugaresFiltrados.length === 0 ? (
              <div className="no-rutas">
                <p>No hay lugares para la ciudad buscada.</p>
              </div>
            ) : (
              <div className="lugares-grid">
                {lugaresFiltrados.map((lugar) => (
                  <article key={lugar._id || `${lugar.nombre}-${lugar.ciudad}`} className="lugar-card">
                    <div className="lugar-imagen-wrap">
                      <img
                        src={lugar.imagen || ''}
                        alt={lugar.nombre}
                        className="lugar-imagen"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="lugar-contenido">
                      <h3>{lugar.nombre}</h3>
                      <p className="lugar-ciudad">{lugar.ciudad}</p>
                      {lugar.descripcion && <p>{lugar.descripcion}</p>}
                      <div className="lugar-meta">
                        <span>{lugar.tipo || 'Otro'}</span>
                        <span>{typeof lugar.precioEntrada === 'number' ? `$${lugar.precioEntrada}` : '$0'}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
