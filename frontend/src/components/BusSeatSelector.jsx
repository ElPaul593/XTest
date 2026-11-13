import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HoldTimer from './HoldTimer';
import Icon from './Icon';
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
import { crearOrdenPago } from '../services/pagos';
import { AlertPopup, ConfirmPopup } from './Popup';

/** Asientos por fila: 2 + pasillo + 2, igual que `SeatLayout` en la API externa. */
const ASIENTOS_POR_FILA = 4;

const ETIQUETA_ESTADO = {
    available: 'disponible',
    heldByMe: 'bloqueado por ti',
    heldByOther: 'bloqueado por otro pasajero',
    reserved: 'vendido'
};

/** "Ventana" o "Pasillo" según la posición dentro de la fila (misma regla que la API). */
function posicionAsiento(numero) {
    const offset = (numero - 1) % ASIENTOS_POR_FILA;
    return offset === 0 || offset === ASIENTOS_POR_FILA - 1 ? 'Ventana' : 'Pasillo';
}

const formatoUSD = (valor) =>
    Number(valor || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

const SeatButton = ({ seat, myHolds, loading, onSeatClick }) => {
    const isSelected = myHolds.some(h => h.asiento === seat.number);
    const posicion = posicionAsiento(seat.number);
    let className = `seat seat-${seat.status}`;
    if (isSelected) className += ' seat-selected';

    return (
        <button
            type="button"
            className={className}
            onClick={() => onSeatClick(seat)}
            disabled={loading || (seat.status !== 'available' && seat.status !== 'heldByMe')}
            aria-pressed={isSelected}
            aria-label={`Asiento ${seat.number}, ${posicion.toLowerCase()}, ${ETIQUETA_ESTADO[seat.status] || seat.status}`}
            title={`Asiento ${seat.number} · ${posicion} · ${ETIQUETA_ESTADO[seat.status] || seat.status}`}
        >
            <span className="seat__num">{seat.number}</span>
            <span className="seat__pos" aria-hidden="true">{posicion === 'Ventana' ? 'vent' : 'pas'}</span>
            {seat.status === 'heldByMe' && <Icon name="check" size={10} className="seat__mark" />}
            {seat.status === 'reserved' && <Icon name="x" size={10} className="seat__mark" />}
        </button>
    );
};

/**
 * Carrocería del bus.
 *
 * Antes el mapa era una rejilla de botones sobre un degradado gris: no se
 * distinguía dónde estaba el conductor, cuál era el pasillo ni qué asientos
 * daban a la ventana. Ahora la fila lleva su número, el pasillo tiene una línea
 * de guía, los laterales marcan las ventanas y la parte delantera muestra el
 * volante y la puerta, de modo que el pasajero se orienta como en el bus real.
 */
const BusGrid = ({ seats, myHolds, loading, onSeatClick }) => {
    if (!seats || seats.length === 0) {
        return <div className="bus-empty">No hay asientos disponibles</div>;
    }

    const rows = [];
    for (let i = 0; i < seats.length; i += ASIENTOS_POR_FILA) {
        const rowSeats = seats.slice(i, i + ASIENTOS_POR_FILA);
        const rowKey = rowSeats[0]?.number ?? i;
        const celda = (seat, col) => (seat
            ? <SeatButton key={seat.number} seat={seat} myHolds={myHolds} loading={loading} onSeatClick={onSeatClick} />
            : <div key={`ph-${rowKey}-${col}`} className="seat-placeholder" aria-hidden="true" />);

        rows.push(
            <div key={rowKey} className="bus-row">
                <span className="bus-row__num" aria-hidden="true">{i / ASIENTOS_POR_FILA + 1}</span>
                <div className="bus-row__side">{celda(rowSeats[0], 0)}{celda(rowSeats[1], 1)}</div>
                <div className="bus-aisle" aria-hidden="true"><i /><i /><i /></div>
                <div className="bus-row__side">{celda(rowSeats[2], 2)}{celda(rowSeats[3], 3)}</div>
            </div>
        );
    }

    return (
        <div className="bus-shell" role="group" aria-label="Mapa de asientos del bus">
            <div className="bus-front" aria-hidden="true">
                <span className="bus-front__windshield">Frente del bus</span>
            </div>

            <div className="bus-cabin" aria-hidden="true">
                <div className="bus-cabin__driver">
                    <Icon name="wheel" size={22} />
                    <span>Conductor</span>
                </div>
                <div className="bus-cabin__door">
                    <Icon name="door" size={20} />
                    <span>Puerta</span>
                </div>
            </div>

            <div className="bus-body">
                <div className="bus-rail bus-rail--left" aria-hidden="true"><span>Ventana</span></div>
                <div className="bus-rows">{rows}</div>
                <div className="bus-rail bus-rail--right" aria-hidden="true"><span>Ventana</span></div>
            </div>

            <div className="bus-back" aria-hidden="true">Parte trasera</div>
        </div>
    );
};

const BusSeatSelector = ({ rutaId, fecha, onClose, onReservationComplete, modoPago = false }) => {
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [myHolds, setMyHolds] = useState([]); // [{ holdId, asiento, rutaId, fecha, expiresAt, remainingMs }]
    const [apiResponse, setApiResponse] = useState(null);
    const [pricingInfo, setPricingInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    const [debugData, setDebugData] = useState(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
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

            setDebugData({
                disponibles: disponiblesRes,
                holds: holdsRes,
                timestamp: new Date().toISOString()
            });

            consecutiveErrors.current = 0;
            setApiResponse({ disponibles: disponiblesRes, holds: holdsRes });

            if (disponiblesRes.ok) {
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
            } else if (disponiblesRes._isFallback) {
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
        } catch (e) {
            consecutiveErrors.current += 1;
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [normalizedRutaId, fecha, myUserId]);

    useEffect(() => {
        loadSeats();
    }, [loadSeats]);

    // Auto-refresh cada 10 segundos — se detiene si hay 3 errores consecutivos
    useEffect(() => {
        consecutiveErrors.current = 0;
        const interval = setInterval(() => {
            if (myHolds.length > 0) return;
            if (consecutiveErrors.current >= 3) return;
            loadSeats();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadSeats, myHolds.length, rutaId, fecha]);

    // Calcular precio total usando la API de pricing (precio de la ruta local)
    const calculateTotalPrice = useCallback(async () => {
        if (myHolds.length === 0) {
            setPricingInfo(null);
            return;
        }

        try {
            // El precio canónico viene de la ruta seleccionada y es el mismo que
            // viaja a la API externa al bloquear, así que coincide con PayPal.
            const pricingResult = await getPricing(myHolds.length, normalizedRutaId);

            if (pricingResult.ok) {
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
                    ahorros: pricingResult.montoDescuento,
                    cobro: pricingResult.cobro || null,
                    _isFallback: pricingResult._isFallback || false
                });
            } else {
                console.warn('[BusSeatSelector] Pricing no disponible:', pricingResult.error);
                setPricingInfo(null);
            }
        } catch (precioErr) {
            console.error('[BusSeatSelector] Error calculando precio:', precioErr);
            setPricingInfo({
                ok: false,
                error: precioErr.message || 'No se pudo obtener el precio vigente de la ruta'
            });
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

        const existingHold = myHolds.find(h => h.asiento === seat.number);

        if (existingHold) {
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
            setLoading(true);
            setError(null);

            try {
                const result = await createHold({ rutaId: rutaIdToUse, fecha, seatNumber: seat.number });

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

    // Cancelar todos los holds (con ventana emergente de la aplicación, no `confirm()`)
    const handleCancelAll = async () => {
        if (myHolds.length === 0) return;
        setConfirmCancelOpen(true);
    };

    const confirmCancelAll = async () => {
        setConfirmCancelOpen(false);
        setLoading(true);
        const rutaIdToUse = normalizeRutaId(rutaId);

        try {
            const results = await Promise.all(myHolds.map(hold =>
                deleteHold({
                    holdId: hold.holdId,
                    rutaId: hold.rutaId || rutaIdToUse,
                    fecha: hold.fecha || fecha,
                    asiento: hold.asiento
                })
            ));

            if (results.every(r => r.ok)) {
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

    // Crea la orden en la API externa y envía al comprador a PayPal
    const handlePagar = async () => {
        setLoading(true);
        setError(null);
        try {
            const orden = await crearOrdenPago(myHolds.map((hold) => hold.holdId));
            window.location.assign(orden.approvalUrl);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Confirmar todas las reservas (flujo sin pago en línea)
    const handleConfirm = async () => {
        if (myHolds.length === 0) return;

        const invalidHolds = myHolds.filter(h => !h.holdId || !h.rutaId || !h.fecha || !h.asiento);
        if (invalidHolds.length > 0) {
            setError('Algunos holds no tienen todos los datos requeridos. Por favor, cancela y vuelve a seleccionar.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const results = await Promise.all(myHolds.map(hold =>
                confirmReserva({
                    holdId: hold.holdId,
                    rutaId: hold.rutaId,
                    fecha: hold.fecha,
                    asiento: hold.asiento
                })
            ));

            const successful = results.filter(r => r.ok);
            const failed = results.filter(r => !r.ok);

            if (successful.length > 0) {
                setPopupMessage({
                    title: 'Reservas confirmadas',
                    message: `¡${successful.length} reserva${successful.length > 1 ? 's' : ''} confirmada${successful.length > 1 ? 's' : ''}!`,
                    variant: 'success'
                });

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
                    setPopupMessage({
                        title: 'Confirmación parcial',
                        message: `Advertencia: ${failed.length} reserva${failed.length > 1 ? 's' : ''} no se pudieron confirmar.`,
                        variant: 'warning'
                    });
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

    const handleTimerExpire = (expiredHoldId) => {
        setMyHolds(prev => prev.filter(h => h.holdId !== expiredHoldId));
        loadSeats();
    };

    const selectedSeatsList = myHolds.map(h => h.asiento).sort((a, b) => a - b);
    const resumen = {
        libres: seats.filter(s => s.status === 'available').length,
        mios: seats.filter(s => s.status === 'heldByMe').length,
        otros: seats.filter(s => s.status === 'heldByOther').length,
        vendidos: seats.filter(s => s.status === 'reserved').length
    };
    const holdsIncompletos = myHolds.some(h => !h.holdId || !h.rutaId || !h.fecha || !h.asiento);

    return (
        <div className="bus-seat-selector">
            <ConfirmPopup
                open={confirmCancelOpen}
                onCancel={() => setConfirmCancelOpen(false)}
                onConfirm={confirmCancelAll}
                title="¿Liberar todos los asientos?"
                message={`Se liberarán ${myHolds.length} asiento${myHolds.length > 1 ? 's' : ''} seleccionado${myHolds.length > 1 ? 's' : ''}.`}
                confirmLabel="Liberar asientos"
                cancelLabel="Mantener asientos"
                destructive
            />
            <AlertPopup
                open={Boolean(popupMessage)}
                onClose={() => setPopupMessage(null)}
                title={popupMessage?.title}
                message={popupMessage?.message}
                variant={popupMessage?.variant}
            />

            <div className="selector-header">
                <div>
                    <h2><Icon name="bus" size="0.95em" /> Selección de asientos</h2>
                    <p>Fecha de viaje: {String(fecha || '')}</p>
                </div>
                {onClose && (
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
                        <Icon name="x" size={20} />
                    </button>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <span><Icon name="alert" size={16} /> {error}</span>
                    <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso"><Icon name="x" size={16} /></button>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <Icon name="loader" size={16} className="spin" /> Actualizando el mapa…
                </div>
            )}

            <BusGrid seats={seats} myHolds={myHolds} loading={loading} onSeatClick={handleSeatClick} />

            <div className="legend">
                <span className="legend-item"><span className="dot available" /> Disponible</span>
                <span className="legend-item"><span className="dot heldByMe" /> Tu selección</span>
                <span className="legend-item"><span className="dot heldByOther" /> Bloqueado por otro</span>
                <span className="legend-item"><span className="dot reserved" /> Vendido</span>
            </div>

            {seats.length > 0 && (
                <div className="bus-stats" aria-label="Resumen de ocupación">
                    <div className="bus-stat"><strong>{resumen.libres}</strong><span>Libres</span></div>
                    <div className="bus-stat bus-stat--mine"><strong>{resumen.mios}</strong><span>Tuyos</span></div>
                    <div className="bus-stat bus-stat--held"><strong>{resumen.otros}</strong><span>En espera</span></div>
                    <div className="bus-stat bus-stat--taken"><strong>{resumen.vendidos}</strong><span>Vendidos</span></div>
                </div>
            )}

            {/* Asientos seleccionados y su cuenta atrás */}
            {selectedSeatsList.length > 0 && (
                <div className="selected-seats-panel">
                    <div className="selected-seats-panel__head">
                        <Icon name="seat" size={18} />
                        <strong>Asientos seleccionados: {selectedSeatsList.join(', ')}</strong>
                    </div>
                    <ul className="selected-seats-list">
                        {myHolds.map(hold => (
                            <li key={hold.holdId}>
                                <span>Asiento {hold.asiento} · {posicionAsiento(hold.asiento)}</span>
                                <HoldTimer
                                    expiresAt={hold.expiresAt}
                                    remainingMs={hold.remainingMs}
                                    onExpire={() => handleTimerExpire(hold.holdId)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Resumen de precio: el que se envía a PayPal */}
            {myHolds.length > 0 && pricingInfo && pricingInfo.ok && (
                <div className="pricing-panel">
                    <h4>
                        <Icon name="wallet" size={18} /> Resumen de precio
                        {pricingInfo._isFallback && <span className="pricing-panel__tag">cálculo local</span>}
                    </h4>
                    <dl className="pricing-rows">
                        <div><dt>Precio por asiento</dt><dd>{formatoUSD(pricingInfo.precioBase)}</dd></div>
                        <div><dt>Asientos</dt><dd>{pricingInfo.cantidadAsientos || myHolds.length}</dd></div>
                        <div><dt>Subtotal</dt><dd>{formatoUSD(pricingInfo.precioBaseTotal)}</dd></div>
                        {pricingInfo.porcentajeDescuento > 0 && (
                            <div className="pricing-rows__save">
                                <dt>Descuento ({pricingInfo.porcentajeDescuento}%)</dt>
                                <dd>−{formatoUSD(pricingInfo.descuentoTotal)}</dd>
                            </div>
                        )}
                    </dl>
                    <div className="pricing-total">
                        <span>Total a pagar</span>
                        <strong>{formatoUSD(pricingInfo.totalPagar)}</strong>
                    </div>
                    {pricingInfo.cobro?.valor && (
                        <div className="pricing-charge">
                            Se cobrarán {pricingInfo.cobro.valor} {pricingInfo.cobro.moneda} en PayPal
                        </div>
                    )}
                    {pricingInfo.ahorros > 0 && (
                        <div className="pricing-savings">
                            <Icon name="check-circle" size={14} /> Ahorras {formatoUSD(pricingInfo.ahorros)}
                        </div>
                    )}
                </div>
            )}

            {/* Acciones */}
            {myHolds.length > 0 && (
                <div className="hold-panel">
                    <div className="hold-actions">
                        <button
                            type="button"
                            className="btn btn-confirm"
                            onClick={modoPago ? handlePagar : handleConfirm}
                            disabled={loading || !pricingInfo?.ok || holdsIncompletos}
                            title={!pricingInfo?.ok ? 'Calculando precio...' : (holdsIncompletos ? 'Faltan datos en algunos holds' : '')}
                        >
                            {modoPago
                                ? <><Icon name="card" size={16} /> Pagar {pricingInfo?.totalPagar != null ? formatoUSD(pricingInfo.totalPagar) : ''} con PayPal</>
                                : <><Icon name="check" size={16} /> Confirmar {myHolds.length} reserva{myHolds.length > 1 ? 's' : ''}</>}
                        </button>
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={handleCancelAll}
                            disabled={loading}
                        >
                            <Icon name="x" size={16} /> Liberar todo
                        </button>
                    </div>
                </div>
            )}

            <div className="actions-bar">
                <button type="button" className="btn btn-refresh" onClick={loadSeats} disabled={loading}>
                    <Icon name="refresh" size={16} /> Actualizar
                </button>
                <button
                    type="button"
                    className="btn btn-refresh"
                    onClick={() => setShowDebug(!showDebug)}
                >
                    <Icon name="search" size={16} /> Datos de la API
                </button>
            </div>

            {/* Panel de depuración */}
            {showDebug && (
                <div className="api-debug">
                    <div className="api-debug__head">
                        <strong>Datos de la API (depuración)</strong>
                        <button type="button" onClick={() => setShowDebug(false)}>Cerrar</button>
                    </div>
                    <details open>
                        <summary>GET /api/asientos/disponibles</summary>
                        <pre>{JSON.stringify(debugData?.disponibles || apiResponse?.disponibles || {}, null, 2)}</pre>
                    </details>
                    <details open>
                        <summary>GET /api/asientos/holds</summary>
                        <pre>{JSON.stringify(debugData?.holds || apiResponse?.holds || {}, null, 2)}</pre>
                    </details>
                    {debugData?.lastHoldResponse && (
                        <details open>
                            <summary>POST /api/asientos/reservar (último hold)</summary>
                            <pre>{JSON.stringify(debugData.lastHoldResponse, null, 2)}</pre>
                        </details>
                    )}
                    {pricingInfo && (
                        <details open>
                            <summary>POST /api/pricing/calcular-precio</summary>
                            <pre>{JSON.stringify(pricingInfo, null, 2)}</pre>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export default BusSeatSelector;
