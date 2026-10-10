import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserReservations, cancelReserva, createMultiSeatReserva } from '../services/reservas';
import { getRutas } from '../services/rutas';
import BusSeatSelector from '../components/BusSeatSelector';
import BoletoQR from '../components/BoletoQR';
import { AlertPopup, ConfirmPopup } from '../components/Popup';
import useFeedback from '../hooks/useFeedback';

/**
 * Dashboard del USUARIO: "Mis Reservas".
 * La administración vive en /admin (protegida por rol). Aquí ya no hay listas
 * de cédulas hardcodeadas: el acceso se controla por sesión/rol en las rutas.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [reservas, setReservas] = useState([]);
  const [resLoading, setResLoading] = useState(true);
  const [resError, setResError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showQuickReserve, setShowQuickReserve] = useState(false);
  const [rutas, setRutas] = useState([]);
  const [selectedRuta, setSelectedRuta] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [isQuickReservation, setIsQuickReservation] = useState(false);
  const [changingSeatFor, setChangingSeatFor] = useState(null);
  const [qrReserva, setQrReserva] = useState(null);

  // Cancelación de reserva pendiente de confirmar: { reserva, enCurso, error }
  const [cancelacion, setCancelacion] = useState(null);

  const { aviso, mostrarExito, mostrarError, cerrarAviso } = useFeedback();

  const today = new Date().toISOString().split('T')[0];

  const loadReservas = useCallback(async () => {
    try {
      setResLoading(true);
      const response = await getUserReservations(page);
      setReservas(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error cargando reservas:', err);
      setResError('No se pudieron cargar tus reservas.');
    } finally {
      setResLoading(false);
    }
  }, [page]);

  const loadRutasData = useCallback(async () => {
    try {
      const response = await getRutas();
      setRutas(Array.isArray(response) ? response : response.data || []);
    } catch (e) {
      console.error('Error loading rutas:', e);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadReservas();
    loadRutasData();
  }, [token, page, navigate, loadReservas, loadRutasData]);

  /** Abre la confirmación de cancelación (antes era `window.confirm`). */
  const pedirCancelacion = (reserva) => {
    setCancelacion({ reserva, enCurso: false, error: null });
  };

  const confirmarCancelacion = async () => {
    if (!cancelacion) return;

    const id = cancelacion.reserva._id || cancelacion.reserva.id;

    try {
      setCancelacion((prev) => ({ ...prev, enCurso: true, error: null }));
      await cancelReserva(id);

      setCancelacion(null);
      loadReservas();
      mostrarExito('La reserva ha quedado cancelada y el asiento vuelve a estar disponible.', 'Reserva cancelada');
    } catch (err) {
      setCancelacion((prev) => ({ ...prev, enCurso: false, error: err.message }));
    }
  };

  const handleStartSeatSelection = () => {
    if (!selectedRuta || !selectedFecha) {
      mostrarError('Selecciona una ruta y una fecha antes de continuar.', 'Faltan datos');
      return;
    }
    setIsQuickReservation(true);
    setShowSeatSelector(true);
  };

  const handleChangeSeat = (reserva) => {
    const rutaIdValue = reserva.ruta?._id || reserva.ruta?.id || reserva.ruta || '';
    const rutaIdString = typeof rutaIdValue === 'object' && rutaIdValue !== null
      ? (rutaIdValue._id || rutaIdValue.id || String(rutaIdValue))
      : String(rutaIdValue);

    setChangingSeatFor({
      reservaId: reserva._id || reserva.id,
      rutaId: rutaIdString,
      fecha: reserva.fecha || today,
      currentSeat: reserva.seatNumber
    });
    setIsQuickReservation(false);
    setShowSeatSelector(true);
  };

  const closeSeatModals = () => {
    setShowSeatSelector(false);
    setShowQuickReserve(false);
    setChangingSeatFor(null);
    setIsQuickReservation(false);
  };

  const handleReservationComplete = async (result) => {
    try {
      if (changingSeatFor) {
        /**
         * Cambio de asiento: PRIMERO se crea la nueva reserva y solo después se
         * cancela la anterior.
         *
         * El orden importa, y antes estaba al revés: se llamaba a
         * `cancelReserva` de forma incondicional, incluso antes de comprobar
         * `result.ok`. Eso abría tres formas de que el usuario se quedara sin
         * nada:
         *
         *   1. Si cerraba el selector de asientos sin elegir (`result.ok` falso),
         *      su reserva original ya había desaparecido y no se creaba ninguna
         *      nueva, sin mostrar ningún aviso.
         *   2. Si `createMultiSeatReserva` fallaba (asiento tomado entre medias,
         *      red caída, validación), la original ya estaba cancelada: pérdida
         *      total.
         *   3. Si la API devolvía `ok` pero sin asientos, se cancelaba y se
         *      informaba de un cambio que no había ocurrido.
         *
         * Con el orden invertido, el peor caso es quedarse con una reserva
         * duplicada —recuperable, y además se avisa— en lugar de con ninguna.
         */
        const asientos = result.asientos || (result.asiento ? [result.asiento] : []);

        if (!result.ok || asientos.length === 0) {
          // No se eligió asiento: la reserva original se queda intacta.
          mostrarError(
            'No se seleccionó ningún asiento nuevo, así que tu reserva actual no se ha modificado.',
            'Cambio cancelado'
          );
          return;
        }

        if (!changingSeatFor.rutaId) {
          mostrarError(
            'No se pudo identificar la ruta de la reserva, así que no se ha modificado nada.',
            'Cambio cancelado'
          );
          return;
        }

        // Paso 1: crear la nueva. Si esto falla, el `catch` informa y la
        // original sigue siendo válida.
        await createMultiSeatReserva({
          ruta: changingSeatFor.rutaId,
          asientos,
          fecha: result.fecha || changingSeatFor.fecha,
          pricing: result.precio,
          tipo: 'NORMAL'
        });

        // Paso 2: liberar la anterior. Si esto falla, el cambio ya surtió efecto
        // pero queda la reserva antigua: se avisa para que la cancele a mano, en
        // lugar de dar por bueno un estado que no es el esperado.
        try {
          await cancelReserva(changingSeatFor.reservaId);
          mostrarExito(
            asientos.length > 1
              ? `Se han cambiado ${asientos.length} asientos: ${asientos.join(', ')}.`
              : `Tu nuevo asiento es el ${asientos[0]}.`,
            'Asiento cambiado'
          );
        } catch (errCancelar) {
          console.error('Error cancelando la reserva anterior:', errCancelar);
          mostrarError(
            `Tu nuevo asiento (${asientos.join(', ')}) quedó reservado, pero no se pudo cancelar la reserva anterior. Cancélala manualmente desde esta misma pantalla para no quedarte con dos.`,
            'Cambio incompleto'
          );
        }
      } else if (result.ok && selectedRuta) {
        const asientos = result.asientos || (result.asiento ? [result.asiento] : []);
        if (asientos.length > 0) {
          await createMultiSeatReserva({
            ruta: selectedRuta,
            asientos,
            fecha: result.fecha || selectedFecha,
            pricing: result.precio,
            tipo: isQuickReservation ? 'RAPIDA' : 'NORMAL'
          });
          const total =
            result.precio?.totalPagar?.toLocaleString() ||
            result.precio?.total?.toLocaleString() ||
            '0';
          mostrarExito(
            `Asientos reservados: ${asientos.join(', ')}. Total: $${total}.`,
            'Reserva completada'
          );
        } else {
          mostrarExito('Tu reserva se ha registrado correctamente.', 'Reserva completada');
        }
      }
    } catch (err) {
      console.error('Error en reserva:', err);
      mostrarError(err, 'No se pudo guardar la reserva');
    } finally {
      closeSeatModals();
      loadReservas();
    }
  };

  if (!token) return null;

  const reservasActivas = reservas.filter(r => r.status !== 'cancelled' && !r.isQuickReservation);

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Mis Reservas</h1>
          <p>Gestiona tus reservas de viaje</p>
        </div>

        <div className="quick-action-bar" style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ color: 'white', margin: '0 0 10px' }}>¿Quieres hacer una nueva reserva?</h3>
          <button
            onClick={() => setShowQuickReserve(true)}
            style={{ background: 'white', color: '#11998e', border: 'none', padding: '12px 24px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            🚌 Reserva Rápida
          </button>
        </div>

        {showQuickReserve && !showSeatSelector && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'white', borderRadius: '16px', padding: '30px', maxWidth: '500px', width: '90%', position: 'relative' }}>
              <button onClick={() => setShowQuickReserve(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🚌 Reserva Rápida</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Selecciona tu ruta:</label>
                  <select value={selectedRuta} onChange={e => setSelectedRuta(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd' }}>
                    <option value="">-- Elige una ruta --</option>
                    {rutas.map(r => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.from} ➜ {r.to} (${r.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Fecha de viaje:</label>
                  <input type="date" value={selectedFecha} onChange={e => setSelectedFecha(e.target.value)} min={today} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd' }} />
                </div>
                <button onClick={handleStartSeatSelection} disabled={!selectedRuta || !selectedFecha} style={{ background: '#11998e', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Ver Asientos Disponibles
                </button>
              </div>
            </div>
          </div>
        )}

        {showSeatSelector && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              <BusSeatSelector
                rutaId={changingSeatFor?.rutaId ? String(changingSeatFor.rutaId) : (selectedRuta ? String(selectedRuta) : '')}
                fecha={changingSeatFor?.fecha || selectedFecha}
                onClose={closeSeatModals}
                onReservationComplete={handleReservationComplete}
              />
            </div>
          </div>
        )}

        {qrReserva && <BoletoQR reserva={qrReserva} onClose={() => setQrReserva(null)} />}

        <div className="dashboard-section">
          {resLoading ? (
            <div className="loading-spinner"></div>
          ) : resError ? (
            <p className="error-message">{resError}</p>
          ) : reservasActivas.length === 0 ? (
            <div className="empty-state">
              <p>No tienes reservas activas. ¡Haz una reserva rápida arriba!</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasActivas.map((reserva) => (
                <div key={reserva._id || reserva.id} className="boleto-card">
                  <div className="boleto-header">
                    <div className="route">
                      <span className="origen">{reserva.ruta?.from || 'Origen'}</span>
                      <span className="arrow">➜</span>
                      <span className="destino">{reserva.ruta?.to || 'Destino'}</span>
                    </div>
                    <div className="precioStatus">
                      <span className={`status-badge ${reserva.status}`}>{reserva.status === 'reserved' ? 'Confirmada' : reserva.status}</span>
                    </div>
                  </div>
                  <div className="boleto-info">
                    <div className="info-item">
                      <span className="label">Asiento(s):</span>
                      <span className="value">
                        {Array.isArray(reserva.seatNumbers) && reserva.seatNumbers.length > 0
                          ? reserva.seatNumbers.join(', ')
                          : `#${reserva.seatNumber}`}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Precio:</span>
                      <span className="value">
                        {reserva.pricing?.total
                          ? `$${Number(reserva.pricing.total).toFixed(2)}`
                          : reserva.precio?.totalPagar
                            ? `$${Number(reserva.precio.totalPagar).toFixed(2)}`
                            : `$${reserva.ruta?.price || '0.00'}`}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Duración:</span>
                      <span className="value">{reserva.ruta?.duration}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Fecha Compra:</span>
                      <span className="value">{new Date(reserva.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="boleto-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setQrReserva(reserva)}
                      style={{ backgroundColor: '#2d3a8c', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
                    >
                      🎫 Ver QR
                    </button>
                    <button
                      className="change-seat-btn"
                      onClick={() => handleChangeSeat(reserva)}
                      style={{ backgroundColor: '#11998e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
                    >
                      🔄 Cambiar Asiento
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => pedirCancelacion(reserva)}
                      style={{ marginTop: '10px' }}
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
              <span>Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmación de cancelación de reserva */}
      <ConfirmPopup
        open={!!cancelacion}
        onCancel={() => setCancelacion(null)}
        onConfirm={confirmarCancelacion}
        title="¿Cancelar esta reserva?"
        message={
          cancelacion
            ? `Ruta ${cancelacion.reserva.ruta?.from || '—'} → ${cancelacion.reserva.ruta?.to || '—'}, fecha ${cancelacion.reserva.fecha || '—'}.`
            : ''
        }
        note="El asiento volverá a estar disponible para otros viajeros. La reserva se conserva en tu historial marcada como cancelada."
        confirmLabel="Sí, cancelar"
        cancelLabel="Mantener reserva"
        destructive
        loading={!!cancelacion?.enCurso}
        error={cancelacion?.error}
      />

      {/* Avisos de resultado */}
      <AlertPopup
        open={!!aviso}
        variant={aviso?.variant}
        title={aviso?.title}
        message={aviso?.message}
        onClose={cerrarAviso}
      />
    </div>
  );
}
