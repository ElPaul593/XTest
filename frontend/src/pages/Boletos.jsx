import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CIUDADES, CIUDADES_OPTIONS } from '../constants/ciudades';
import { API_BASE_URL } from '../constants/api';
import { createReserva } from '../services/reservas';

export default function Boletos() {
  const [loading, setLoading] = useState(true);
  const [rutas, setRutas] = useState([]);
  const [rutasFiltradas, setRutasFiltradas] = useState([]);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Estados para los filtros
  const [filtros, setFiltros] = useState({
    origen: searchParams.get('origen') || '',
    destino: searchParams.get('destino') || '',
    fecha: searchParams.get('fecha') || ''
  });

  useEffect(() => {
    // Validar autenticación
    if (!token) {
      navigate('/login');
      return;
    }

    // Cargar rutas desde la base de datos
    fetchRutas();
  }, [token, navigate]);

  useEffect(() => {
    // Aplicar filtros cuando cambian las rutas o los filtros
    aplicarFiltros();
  }, [rutas, filtros]);

  const fetchRutas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/rutas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las rutas');
      }

      const data = await response.json();
      setRutas(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rutas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let rutasFiltradas = [...rutas];

    // Filtrar por origen
    if (filtros.origen) {
      rutasFiltradas = rutasFiltradas.filter(ruta =>
        ruta.from.toLowerCase() === filtros.origen.toLowerCase()
      );
    }

    // Filtrar por destino
    if (filtros.destino) {
      rutasFiltradas = rutasFiltradas.filter(ruta =>
        ruta.to.toLowerCase() === filtros.destino.toLowerCase()
      );
    }

    setRutasFiltradas(rutasFiltradas);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleBuscar = () => {
    aplicarFiltros();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      origen: '',
      destino: '',
      fecha: ''
    });
    setRutasFiltradas(rutas);
  };

  const boletosSample = (rutasFiltradas.length > 0 ? rutasFiltradas : rutas).map((ruta) => ({
    id: ruta._id || ruta.id,
    origen: ruta.from,
    destino: ruta.to,
    fecha: '2025-10-15', // Fecha por defecto o podrías obtenerla de alguna parte
    hora: '08:00', // Hora por defecto o podrías obtenerla de alguna parte
    precio: `$${ruta.price}`,
    asientos: ruta.seats,
    empresa: 'TransEcuador', // Empresa por defecto o podrías obtenerla de alguna parte
    duracion: ruta.duration
  }));

  const handleReservar = async (boletoId) => {
    try {
      if (!boletoId || typeof boletoId !== 'string') {
        throw new Error('La ruta seleccionada no tiene un ID válido para reservar. Recarga la página.');
      }

      const confirm = window.confirm('¿Confirmar reserva de este boleto?');
      if (!confirm) return;

      // Asumiendo que el endpoint espera { ruta: string, seatNumber: number }
      // Para este demo, asignamos un asiento aleatorio o fijo (ej. 1)
      // En una app real, el usuario elegiría el asiento.
      const seatNumber = Math.floor(Math.random() * 20) + 1;

      await createReserva({
        ruta: boletoId,
        seatNumber: seatNumber
      });

      alert('¡Reserva creada con éxito! Redirigiendo a tus reservas...');
      navigate('/reservas');
    } catch (err) {
      console.error('Error creando reserva:', err);
      alert('Error al crear la reserva: ' + err.message);
    }
  };

  if (!token) {
    return null; // No mostrar nada mientras redirige
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando boletos disponibles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={fetchRutas}>Reintentar</button>
      </div>
    );
  }

  if (rutas.length === 0) {
    return (
      <div className="empty-container">
        <p>No hay rutas disponibles en este momento</p>
      </div>
    );
  }

  return (
    <div className="boletos-container">
      <div className="container">
        <div className="boletos-header">
          <h1>Boletos Disponibles</h1>
          <p>Encuentra y reserva tu viaje perfecto</p>
        </div>

        <div className="search-filters">
          <div className="filter-group">
            <label>Origen</label>
            <select
              value={filtros.origen}
              onChange={(e) => handleFiltroChange('origen', e.target.value)}
            >
              <option value="">Todas las ciudades</option>
              {CIUDADES_OPTIONS.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Destino</label>
            <select
              value={filtros.destino}
              onChange={(e) => handleFiltroChange('destino', e.target.value)}
            >
              <option value="">Todas las ciudades</option>
              {CIUDADES_OPTIONS.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Fecha</label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleFiltroChange('fecha', e.target.value)}
            />
          </div>
          <button className="search-btn" onClick={handleBuscar}>Buscar</button>
          {(filtros.origen || filtros.destino || filtros.fecha) && (
            <button className="clear-btn" onClick={handleLimpiarFiltros}>Limpiar</button>
          )}
        </div>

        {boletosSample.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron rutas con los filtros seleccionados</p>
            <button onClick={handleLimpiarFiltros}>Ver todas las rutas</button>
          </div>
        ) : (
          <div className="results-info">
            <p>Mostrando {boletosSample.length} ruta(s) disponible(s)</p>
          </div>
        )}

        <div className="boletos-grid">
          {boletosSample.map(boleto => (
            <div key={boleto.id} className="boleto-card">
              <div className="boleto-header">
                <div className="route">
                  <span className="origen">{boleto.origen}</span>
                  <span className="arrow">➜</span>
                  <span className="destino">{boleto.destino}</span>
                </div>
                <div className="precio">{boleto.precio}</div>
              </div>

              <div className="boleto-info">
                <div className="info-item">
                  <span className="label">Fecha:</span>
                  <span className="value">{boleto.fecha}</span>
                </div>
                <div className="info-item">
                  <span className="label">Hora:</span>
                  <span className="value">{boleto.hora}</span>
                </div>
                <div className="info-item">
                  <span className="label">Empresa:</span>
                  <span className="value">{boleto.empresa}</span>
                </div>
                <div className="info-item">
                  <span className="label">Asientos:</span>
                  <span className="value">{boleto.asientos} disponibles</span>
                </div>
                {boleto.duracion && (
                  <div className="info-item">
                    <span className="label">Duración:</span>
                    <span className="value">{boleto.duracion}</span>
                  </div>
                )}
              </div>

              <div className="boleto-actions">
                <button
                  className="reservar-btn"
                  disabled={!boleto.id || typeof boleto.id !== 'string'}
                  onClick={() => handleReservar(boleto.id)}
                >
                  Reservar Ahora
                </button>
                <div className="destino-links">
                  <Link
                    to={`/destino?ciudad=${encodeURIComponent(boleto.destino)}`}
                    className="link-destino"
                  >
                    Ver Hoteles y Lugares
                  </Link>
                  <Link
                    to={`/recomendados?ciudad=${encodeURIComponent(boleto.destino)}`}
                    className="link-recomendados"
                  >
                    Ver Recomendados
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}