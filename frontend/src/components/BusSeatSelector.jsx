import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HoldTimer from './HoldTimer';
import './BusSeatSelector.css';
import {
    getDisponibles,
    createHold,
    getHolds,
    deleteHold,
    confirmReserva,
    buildSeatMap
} from '../services/asientosService';
import { getPricing } from '../services/pricingService';

const SeatButton = ({ seat, myHolds, loading, onSeatClick }) => {
    const isSelected = myHolds.some(h => h.asiento === seat.number);
    let className = `seat seat-${seat.status}`;
    if (isSelected) className += ' seat-selected';

    return (
        <button
            className={className}
            onClick={() => onSeatClick(seat)}
            disabled={loading || (seat.status !== 'available' && seat.status !== 'heldByMe')}
            title={`Asiento ${seat.number} - ${seat.status}`}
        >
            {seat.number}
        </button>
    );
};

const BusGrid = ({ seats, myHolds, loading, onSeatClick }) => {
    if (!seats || seats.length === 0) {
        return <div className="no-seats" style={{ color: '#000', padding: '20px', textAlign: 'center' }}>No hay asientos disponibles</div>;
    }

    const rows = [];
    for (let i = 0; i < seats.length; i += 4) {
        const rowSeats = seats.slice(i, i + 4);
        const rowKey = rowSeats[0]?.number ?? i;
        rows.push(
            <div key={rowKey} className="bus-row">
                {rowSeats[0] ? <SeatButton seat={rowSeats[0]} myHolds={myHolds} loading={loading} onSeatClick={onSeatClick} /> : <div className="seat-placeholder"></div>}
                {rowSeats[1] ? <SeatButton seat={rowSeats[1]} myHolds={myHolds} loading={loading} onSeatClick={onSeatClick} /> : <div className="seat-placeholder"></div>}
                <div className="aisle"></div>
                {rowSeats[2] ? <SeatButton seat={rowSeats[2]} myHolds={myHolds} loading={loading} onSeatClick={onSeatClick} /> : <div className="seat-placeholder"></div>}
                {rowSeats[3] ? <SeatButton seat={rowSeats[3]} myHolds={myHolds} loading={loading} onSeatClick={onSeatClick} /> : <div className="seat-placeholder"></div>}
            </div>
        );
    }
    return rows;
};

const BusSeatSelector = ({ rutaId, fecha, onClose, onReservationComplete }) => {
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [myHolds, setMyHolds] = useState([]); // Array de holds: [{ holdId, asiento, rutaId, fecha, expiresAt, remainingMs }]
    const [apiResponse, setApiResponse] = useState(null);
    const [pricingInfo, setPricingInfo] = useState(null); // { precioBase, descuento, recargo, totalPagar }
    const [showDebug, setShowDebug] = useState(false);
    const [debugData, setDebugData] = useState(null);
    const consecutiveErrors = useRef(0); // Contador de errores para backoff del intervalo

    // Normalizar rutaId - puede venir como objeto o string
    const normalizeRutaId = (rutaIdValue) => {
        if (!rutaIdValue) return '';
        if (typeof rutaIdValue === 'string') return rutaIdValue;
        if (typeof rutaIdValue === 'object' && rutaIdValue !== null) {
            return rutaIdValue._id || rutaIdValue.id || String(rutaIdValue);
        }
        return String(rutaIdValue);
    };

    const normalizedRutaId = useMemo(() => normalizeRutaId(rutaId), [rutaId]);

    const myUserId = (() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.id || payload.userId || 'guest';
            } catch {
                return 'guest';
            }
        }
        return 'guest';
    })();

    // Cargar estado inicial
    const loadSeats = useCallback(async () => {
        const rutaIdToUse = normalizeRutaId(rutaId);
        if (!rutaIdToUse || !fecha) return;

        setLoading(true);
        setError(null);

        try {
            const [disponiblesRes, holdsRes] = await Promise.all([
                getDisponibles({ rutaId: rutaIdToUse, fecha }),
                getHolds()
            ]);

            // Guardar para debug
            setDebugData({
                disponibles: disponiblesRes,
                holds: holdsRes,
                timestamp: new Date().toISOString()
            });

            consecutiveErrors.current = 0; // Resetear en éxito
            setApiResponse({ disponibles: disponiblesRes, holds: holdsRes });

            if (disponiblesRes.ok) {
                // Normalizar la respuesta - puede venir como available[] o asientos[]
                let availableSeats = [];
                if (Array.isArray(disponiblesRes.available)) {
                    availableSeats = disponiblesRes.available;
                } else if (Array.isArray(disponiblesRes.asientos)) {
                    availableSeats = disponiblesRes.asientos
                        .filter(a => a && (a.estado === 'available' || a.estado === 'disponible'))
                        .map(a => typeof a === 'object' ? a.numero : a);
                }

                const seatMap = buildSeatMap({
                    available: availableSeats,
                    holds: holdsRes.holds || [],
                    total: disponiblesRes.total || 40,
                    myUserId
                });
                setSeats(seatMap || []);

                // Buscar todos mis holds activos para esta ruta y fecha
                const myActiveHolds = (holdsRes.holds || []).filter(
                    h => (h.userId === myUserId || h.clientId === myUserId) && h.rutaId === rutaIdToUse && h.fecha === fecha
                );
                if (myActiveHolds.length > 0) {
                    setMyHolds(myActiveHolds.map(h => ({
                        holdId: h.holdId,
                        asiento: h.asiento,
                        rutaId: h.rutaId || rutaIdToUse,
                        fecha: h.fecha || fecha,
                        expiresAt: h.expiresAt,
                        remainingMs: h.remainingMs
                    })));
                }
            } else {
                if (disponiblesRes._isFallback) {
                    const seatMap = buildSeatMap({
                        available: disponiblesRes.available || [],
                        holds: [],
                        total: 40,
                        myUserId
                    });
                    setSeats(seatMap || []);
                } else {
                    setError(disponiblesRes.error || 'Error al cargar asientos');
                }
            }
        } catch (e) {
            consecutiveErrors.current += 1; // Incrementar en error
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [normalizedRutaId, fecha, myUserId]);

    useEffect(() => {
        loadSeats();
    }, [loadSeats]);

    // Auto-refresh cada 10 segundos — se detiene si hay 3 errores consecutivos (evita spam de 404/timeouts)
    useEffect(() => {
        consecutiveErrors.current = 0; // Resetear al cambiar ruta o fecha
        const interval = setInterval(() => {
            if (myHolds.length > 0) return; // No refrescar si el usuario tiene holds activos
            if (consecutiveErrors.current >= 3) return; // Detener si la API falla repetidamente
            loadSeats();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadSeats, myHolds.length, rutaId, fecha]);

    // Calcular precio total usando la API de pricing
    const calculateTotalPrice = useCallback(async () => {
        if (myHolds.length === 0) {
            setPricingInfo(null);
            return;
        }

        try {
            // Pasar rutaId para que use el precio de la ruta local, no el de la API externa
            console.log(`[BusSeatSelector] Llamando getPricing con cantidad: ${myHolds.length}, rutaId: ${normalizedRutaId}`);
            const pricingResult = await getPricing(myHolds.length, normalizedRutaId);
            console.log('[BusSeatSelector] Pricing result:', pricingResult);

            if (pricingResult.ok) {
                // La API retorna: { cantidad, precioUnitario, subtotal, porcentajeDescuento, montoDescuento, total, ahorros }
                setPricingInfo({
                    ok: true,
                    cantidad: pricingResult.cantidad,
                    cantidadAsientos: pricingResult.cantidad,
                    precioBase: pricingResult.precioUnitario,
                    precioBaseTotal: pricingResult.subtotal,
                    porcentajeDescuento: pricingResult.porcentajeDescuento,
                    descuento: pricingResult.montoDescuento,
                    descuentoTotal: pricingResult.montoDescuento,
                    recargo: 0,
                    recargoTotal: 0,
                    totalPagar: pricingResult.total,
                    ahorros: pricingResult.ahorros,
                    _isFallback: pricingResult._isFallback || false
                });
            } else {
                console.warn('[BusSeatSelector] Pricing no disponible:', pricingResult.error);
                setPricingInfo(null);
            }
        } catch (precioErr) {
            console.error('[BusSeatSelector] Error calculando precio:', precioErr);
            setPricingInfo(null);
        }
    }, [myHolds.length, normalizedRutaId]);

    useEffect(() => {
        calculateTotalPrice();
    }, [calculateTotalPrice]);

    // Manejar selección/deselección de asiento
    const handleSeatClick = async (seat) => {
        if (!seat) return;

        const rutaIdToUse = normalizeRutaId(rutaId);
        if (!rutaIdToUse || !fecha) {
            setError('Faltan rutaId o fecha para crear el hold');
            return;
        }

        // Verificar si el asiento ya está en mis holds
        const existingHold = myHolds.find(h => h.asiento === seat.number);

        if (existingHold) {
            // Deseleccionar: cancelar el hold
            setLoading(true);
            setError(null);

            try {
                const result = await deleteHold({
                    holdId: existingHold.holdId,
                    rutaId: existingHold.rutaId || rutaIdToUse,
                    fecha: existingHold.fecha || fecha,
                    asiento: existingHold.asiento
                });

                if (result.ok) {
                    setMyHolds(prev => prev.filter(h => h.holdId !== existingHold.holdId));
                    await loadSeats();
                } else {
                    setError(result.error || 'Error al cancelar hold');
                }
            } catch (err) {
                console.error('Error cancelando hold:', err);
                setError(err.message || 'Error al cancelar hold');
            } finally {
                setLoading(false);
            }
        } else if (seat.status === 'available') {
            // Seleccionar: crear hold
            setLoading(true);
            setError(null);

            try {
                const result = await createHold({ rutaId: rutaIdToUse, fecha, seatNumber: seat.number });

                // Guardar para debug
                setDebugData(prev => ({
                    ...prev,
                    lastHoldResponse: result,
                    timestamp: new Date().toISOString()
                }));

                if (result.ok) {
                    setMyHolds(prev => [...prev, {
                        holdId: result.holdId,
                        asiento: seat.number,
                        rutaId: rutaIdToUse,
                        fecha: String(fecha),
                        expiresAt: result.expiresAt,
                        remainingMs: result.remainingMs
                    }]);
                    await loadSeats();
                } else {
                    setError(result.error || 'Error al crear hold');
                }
            } catch (err) {
                console.error('Error creando hold:', err);
                setError(err.message || 'Error al crear hold');
            } finally {
                setLoading(false);
            }
        }
    };

    // Cancelar todos los holds
    const handleCancelAll = async () => {
        if (myHolds.length === 0) return;

        if (!window.confirm(`¿Cancelar todos los holds? (${myHolds.length} asiento${myHolds.length > 1 ? 's' : ''})`)) {
            return;
        }

        setLoading(true);
        const rutaIdToUse = normalizeRutaId(rutaId);

        try {
            const deletePromises = myHolds.map(hold =>
                deleteHold({
                    holdId: hold.holdId,
                    rutaId: hold.rutaId || rutaIdToUse,
                    fecha: hold.fecha || fecha,
                    asiento: hold.asiento
                })
            );

            const results = await Promise.all(deletePromises);
            const allOk = results.every(r => r.ok);

            if (allOk) {
                setMyHolds([]);
                setPricingInfo(null);
                await loadSeats();
            } else {
                setError('Algunos holds no se pudieron cancelar');
            }
        } catch (err) {
            setError(err.message || 'Error al cancelar holds');
        } finally {
            setLoading(false);
        }
    };

    // Confirmar todas las reservas
    const handleConfirm = async () => {
        if (myHolds.length === 0) return;

        // Validar que todos los holds tengan los datos requeridos
        const invalidHolds = myHolds.filter(h => !h.holdId || !h.rutaId || !h.fecha || !h.asiento);
        if (invalidHolds.length > 0) {
            setError('Algunos holds no tienen todos los datos requeridos. Por favor, cancela y vuelve a seleccionar.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Confirmar todos los holds
            const confirmPromises = myHolds.map(hold =>
                confirmReserva({
                    holdId: hold.holdId,
                    rutaId: hold.rutaId,
                    fecha: hold.fecha,
                    asiento: hold.asiento
                })
            );

            const results = await Promise.all(confirmPromises);
            const successful = results.filter(r => r.ok);
            const failed = results.filter(r => !r.ok);

            if (successful.length > 0) {
                alert(`¡${successful.length} reserva${successful.length > 1 ? 's' : ''} confirmada${successful.length > 1 ? 's' : ''}!`);

                // Pasar información completa incluyendo precio
                const completeResult = {
                    ok: true,
                    asientos: myHolds.map(h => h.asiento),
                    rutaId: myHolds[0]?.rutaId,
                    fecha: myHolds[0]?.fecha,
                    precio: pricingInfo ? {
                        precioBase: pricingInfo.precioBase,
                        cantidadAsientos: pricingInfo.cantidadAsientos,
                        precioBaseTotal: pricingInfo.precioBaseTotal,
                        descuento: pricingInfo.descuento,
                        descuentoTotal: pricingInfo.descuentoTotal,
                        recargo: pricingInfo.recargo,
                        recargoTotal: pricingInfo.recargoTotal,
                        totalPagar: pricingInfo.totalPagar,
                        motivoDescuento: pricingInfo.motivoDescuento,
                        motivoRecargo: pricingInfo.motivoRecargo
                    } : null,
                    results: successful
                };

                setMyHolds([]);
                setPricingInfo(null);
                await loadSeats();

                if (onReservationComplete) {
                    onReservationComplete(completeResult);
                }

                if (failed.length > 0) {
                    alert(`Advertencia: ${failed.length} reserva${failed.length > 1 ? 's' : ''} no se pudieron confirmar.`);
                }
            } else {
                setError('No se pudo confirmar ninguna reserva');
            }
        } catch (err) {
            console.error('Error confirmando reservas:', err);
            setError(err.message || 'Error al confirmar reservas');
        } finally {
            setLoading(false);
        }
    };

    // Cuando un timer expira
    const handleTimerExpire = (expiredHoldId) => {
        setMyHolds(prev => prev.filter(h => h.holdId !== expiredHoldId));
        loadSeats();
    };

    // Lista de asientos seleccionados
    const selectedSeatsList = myHolds.map(h => h.asiento).sort((a, b) => a - b);

    return (
        <div className="bus-seat-selector">
            <div className="selector-header">
                <h2 style={{ color: '#000' }}>Selección de Asientos</h2>
                <p style={{ color: '#000' }}>Ruta: {normalizedRutaId || 'N/A'} | Fecha: {String(fecha || '')}</p>
                {onClose && (
                    <button className="btn-close" onClick={onClose}>✕</button>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <span style={{ color: '#000' }}>{error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {loading && <div className="loading-overlay" style={{ color: '#000' }}>Cargando...</div>}

            <div className="bus-container">
                <div className="driver-section">🚌 Conductor</div>
                <div className="seats-grid">
                    <BusGrid seats={seats} myHolds={myHolds} loading={loading} onSeatClick={handleSeatClick} />
                </div>
            </div>

            <div className="legend">
                <span className="legend-item"><span className="dot available"></span> Disponible</span>
                <span className="legend-item"><span className="dot heldByMe"></span> Mi Hold</span>
                <span className="legend-item"><span className="dot heldByOther"></span> Ocupado (Hold)</span>
                <span className="legend-item"><span className="dot reserved"></span> Reservado</span>
            </div>

            {/* Lista de asientos seleccionados */}
            {selectedSeatsList.length > 0 && (
                <div className="selected-seats-panel" style={{
                    background: '#e8f5e9',
                    border: '2px solid #4caf50',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px'
                }}>
                    <strong style={{ color: '#000', display: 'block', marginBottom: '10px', fontSize: '16px' }}>
                        Asientos seleccionados: [{selectedSeatsList.join(', ')}]
                    </strong>
                    {myHolds.map(hold => (
                        <div key={hold.holdId} style={{ marginBottom: '8px', fontSize: '14px', color: '#000' }}>
                            <span>Asiento #{hold.asiento}</span>
                            <HoldTimer
                                expiresAt={hold.expiresAt}
                                remainingMs={hold.remainingMs}
                                onExpire={() => handleTimerExpire(hold.holdId)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Panel de Precio */}
            {myHolds.length > 0 && pricingInfo && pricingInfo.ok && (
                <div className="pricing-panel" style={{
                    marginBottom: '15px',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#000' }}>
                        💰 Resumen de Precio {pricingInfo._isFallback && <span style={{ color: '#999', fontSize: '12px' }}>(local)</span>}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#000' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Precio Unitario:</span>
                            <strong>${pricingInfo.precioBase?.toLocaleString() || '0'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Cantidad de Asientos:</span>
                            <strong>{pricingInfo.cantidadAsientos || myHolds.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Subtotal:</span>
                            <strong>${pricingInfo.precioBaseTotal?.toLocaleString() || '0'}</strong>
                        </div>
                        {pricingInfo.porcentajeDescuento > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745' }}>
                                <span>Descuento ({pricingInfo.porcentajeDescuento}%):</span>
                                <strong>-${pricingInfo.descuentoTotal?.toLocaleString() || '0'}</strong>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '2px solid #dee2e6',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>
                            <span>Total a Pagar:</span>
                            <strong style={{ color: '#11998e' }}>
                                ${pricingInfo.totalPagar?.toLocaleString() || '0'}
                            </strong>
                        </div>
                        {pricingInfo.ahorros > 0 && (
                            <div style={{
                                textAlign: 'center',
                                background: '#d4edda',
                                color: '#155724',
                                padding: '8px',
                                borderRadius: '4px',
                                marginTop: '8px',
                                fontWeight: '600'
                            }}>
                                ¡Ahorras ${pricingInfo.ahorros?.toLocaleString() || '0'}!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Panel de acciones */}
            {myHolds.length > 0 && (
                <div className="hold-panel">
                    <div className="hold-actions">
                        <button
                            className="btn btn-confirm"
                            onClick={handleConfirm}
                            disabled={loading || !pricingInfo?.ok || myHolds.some(h => !h.holdId || !h.rutaId || !h.fecha || !h.asiento)}
                            title={!pricingInfo?.ok ? 'Calculando precio...' : (myHolds.some(h => !h.holdId || !h.rutaId || !h.fecha || !h.asiento) ? 'Faltan datos en algunos holds' : '')}
                        >
                            ✓ Confirmar {myHolds.length} Reserva{myHolds.length > 1 ? 's' : ''}
                        </button>
                        <button
                            className="btn btn-cancel"
                            onClick={handleCancelAll}
                            disabled={loading}
                        >
                            ✕ Cancelar Todo
                        </button>
                    </div>
                </div>
            )}

            <div className="actions-bar">
                <button className="btn btn-refresh" onClick={loadSeats} disabled={loading}>
                    🔄 Refrescar
                </button>
                <button
                    className="btn btn-refresh"
                    onClick={() => setShowDebug(!showDebug)}
                    style={{ marginLeft: '10px' }}
                >
                    🔍 Ver datos de la API
                </button>
            </div>

            {/* Panel de Debug */}
            {showDebug && (
                <div className="api-debug" style={{
                    background: '#1a1a2e',
                    color: '#0f0',
                    padding: '15px',
                    borderRadius: '8px',
                    marginTop: '15px',
                    maxHeight: '400px',
                    overflow: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong style={{ color: '#fff' }}>Datos de la API (Debug)</strong>
                        <button
                            onClick={() => setShowDebug(false)}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cerrar
                        </button>
                    </div>
                    <details open>
                        <summary style={{ color: '#888', cursor: 'pointer', marginBottom: '10px' }}>GET /api/asientos/disponibles</summary>
                        <pre style={{ color: '#0f0', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(debugData?.disponibles || apiResponse?.disponibles || {}, null, 2)}
                        </pre>
                    </details>
                    <details open>
                        <summary style={{ color: '#888', cursor: 'pointer', marginBottom: '10px' }}>GET /api/asientos/holds</summary>
                        <pre style={{ color: '#0f0', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(debugData?.holds || apiResponse?.holds || {}, null, 2)}
                        </pre>
                    </details>
                    {debugData?.lastHoldResponse && (
                        <details open>
                            <summary style={{ color: '#888', cursor: 'pointer', marginBottom: '10px' }}>POST /api/asientos/reservar (último hold)</summary>
                            <pre style={{ color: '#0f0', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(debugData.lastHoldResponse, null, 2)}
                            </pre>
                        </details>
                    )}
                    {pricingInfo && (
                        <details open>
                            <summary style={{ color: '#888', cursor: 'pointer', marginBottom: '10px' }}>POST /api/asientos/calcular-precio</summary>
                            <pre style={{ color: '#0f0', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(pricingInfo, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export default BusSeatSelector;
