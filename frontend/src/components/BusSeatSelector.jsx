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

/**
 * Reglas de volumen. La API externa es quien las impone (y responde 400 si se
 * incumplen); aquí se replican solo para avisar al instante y no esperar a la
 * red. Si cambian en la API, cambian en `MAX_SEATS_PER_BOOKING` y
 * `CORPORATE_DISCOUNT_FROM`.
 */
const MAX_ASIENTOS = 10;
const RAZON_SOCIAL_DESDE = 5;

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

const SeatButton = React.memo(function SeatButton({ seat, picked, busy, onSeatClick }) {
    const posicion = posicionAsiento(seat.number);
    const estado = picked ? 'picked' : seat.status;
    const disponible = seat.status === 'available' || seat.status === 'heldByMe';

    return (
        <button
            type="button"
            className={`seat seat-${estado}`}
            onClick={() => onSeatClick(seat)}
            disabled={busy || !disponible}
            aria-pressed={picked || seat.status === 'heldByMe'}
            aria-label={`Asiento ${seat.number}, ${posicion.toLowerCase()}, ${picked ? 'seleccionado' : ETIQUETA_ESTADO[seat.status] || seat.status}`}
            title={`Asiento ${seat.number} · ${posicion} · ${picked ? 'seleccionado' : ETIQUETA_ESTADO[seat.status] || seat.status}`}
        >
            <span className="seat__num">{seat.number}</span>
            <span className="seat__pos" aria-hidden="true">{posicion === 'Ventana' ? 'vent' : 'pas'}</span>
            {(picked || seat.status === 'heldByMe') && <Icon name="check" size={10} className="seat__mark" />}
            {seat.status === 'reserved' && <Icon name="x" size={10} className="seat__mark" />}
        </button>
    );
});

/**
 * Carrocería del bus: parabrisas, cabina con volante y puerta, laterales
 * marcados como ventana, número de fila, pasillo con guía y cola.
 */
const BusGrid = ({ seats, picked, busy, onSeatClick }) => {
    if (!seats || seats.length === 0) {
        return <div className="bus-empty">No hay asientos disponibles</div>;
    }

    const rows = [];
    for (let i = 0; i < seats.length; i += ASIENTOS_POR_FILA) {
        const rowSeats = seats.slice(i, i + ASIENTOS_POR_FILA);
        const rowKey = rowSeats[0]?.number ?? i;
        const celda = (seat, col) => (seat
            ? <SeatButton key={seat.number} seat={seat} picked={picked.has(seat.number)} busy={busy} onSeatClick={onSeatClick} />
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
                <div className="bus-cabin__driver"><Icon name="wheel" size={22} /><span>Conductor</span></div>
                <div className="bus-cabin__door"><Icon name="door" size={20} /><span>Puerta</span></div>
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
    const [loading, setLoading] = useState(false);   // carga del mapa (no bloquea la selección)
    const [busy, setBusy] = useState(false);         // red en curso: pagar, confirmar o liberar
    const [error, setError] = useState(null);
    const [picked, setPicked] = useState(() => new Set()); // elegidos en pantalla, aún SIN bloquear
    const [myHolds, setMyHolds] = useState([]);      // ya bloqueados en la API: [{ holdId, asiento, rutaId, fecha, expiresAt, remainingMs, companyName }]
    const [company, setCompany] = useState('');
    const [pricingInfo, setPricingInfo] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    const [debugData, setDebugData] = useState(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const consecutiveErrors = useRef(0);

    const normalizeRutaId = (rutaIdValue) => {
        if (!rutaIdValue) return '';
        if (typeof rutaIdValue === 'string') return rutaIdValue;
        if (typeof rutaIdValue === 'object' && rutaIdValue !== null) {
            return rutaIdValue._id || rutaIdValue.id || String(rutaIdValue);
        }
        return String(rutaIdValue);
    };

    const normalizedRutaId = useMemo(() => normalizeRutaId(rutaId), [rutaId]);

    const myUserId = useMemo(() => {
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
    }, []);

    // ------------------------------------------------------------------ Carga

    /**
     * Carga el mapa. `silent` no enciende el indicador de carga: el refresco
     * periódico no debe parpadear ni congelar la selección.
     */
    const loadSeats = useCallback(async ({ silent = false } = {}) => {
        if (!normalizedRutaId || !fecha) return;
        if (!silent) setLoading(true);

        try {
            const [disponiblesRes, holdsRes] = await Promise.all([
                getDisponibles({ rutaId: normalizedRutaId, fecha }),
                getHolds()
            ]);

            setDebugData((prev) => ({ ...prev, disponibles: disponiblesRes, holds: holdsRes, timestamp: new Date().toISOString() }));
            consecutiveErrors.current = 0;
            setApiResponse({ disponibles: disponiblesRes, holds: holdsRes });

            let availableSeats = [];
            if (disponiblesRes.ok) {
                if (Array.isArray(disponiblesRes.available)) {
                    availableSeats = disponiblesRes.available;
                } else if (Array.isArray(disponiblesRes.asientos)) {
                    availableSeats = disponiblesRes.asientos
                        .filter(a => a && (a.estado === 'available' || a.estado === 'disponible'))
                        .map(a => typeof a === 'object' ? a.numero : a);
                }
            } else if (disponiblesRes._isFallback) {
                availableSeats = disponiblesRes.available || [];
            } else {
                setError(disponiblesRes.error || 'Error al cargar asientos');
                return;
            }

            const seatMap = buildSeatMap({
                available: availableSeats,
                holds: holdsRes.holds || [],
                total: disponiblesRes.total || 40,
                myUserId
            }) || [];
            setSeats(seatMap);

            const mios = (holdsRes.holds || []).filter(
                h => (h.userId === myUserId || h.clientId === myUserId) && h.rutaId === normalizedRutaId && h.fecha === fecha
            );
            setMyHolds(mios.map(h => ({
                holdId: h.holdId,
                asiento: h.asiento,
                rutaId: h.rutaId || normalizedRutaId,
                fecha: h.fecha || fecha,
                expiresAt: h.expiresAt,
                remainingMs: h.remainingMs,
                companyName: h.companyName || null
            })));

            // Si otro pasajero se llevó un asiento que tenías marcado, se quita.
            const libres = new Set(seatMap.filter(s => s.status === 'available').map(s => s.number));
            setPicked((prev) => {
                const kept = [...prev].filter(n => libres.has(n));
                return kept.length === prev.size ? prev : new Set(kept);
            });
        } catch (e) {
            consecutiveErrors.current += 1;
            setError(e.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [normalizedRutaId, fecha, myUserId]);

    useEffect(() => { loadSeats(); }, [loadSeats]);

    // Refresco silencioso cada 10 s; se detiene con 3 errores seguidos o mientras se paga.
    useEffect(() => {
        consecutiveErrors.current = 0;
        const interval = setInterval(() => {
            if (busy || consecutiveErrors.current >= 3 || document.visibilityState !== 'visible') return;
            loadSeats({ silent: true });
        }, 10000);
        return () => clearInterval(interval);
    }, [loadSeats, busy]);

    // ------------------------------------------------------------------ Carrito

    const pickedList = useMemo(() => [...picked].sort((a, b) => a - b), [picked]);
    const heldList = useMemo(() => myHolds.map(h => h.asiento).sort((a, b) => a - b), [myHolds]);
    const cartCount = pickedList.length + heldList.length;
    const needsCompany = cartCount >= RAZON_SOCIAL_DESDE;
    const companyOk = !needsCompany || company.trim().length > 0 || myHolds.some(h => h.companyName);

    // Cotización: se calcula con el número de asientos del carrito y NO bloquea la
    // selección. Con un pequeño retardo para no disparar una petición por clic.
    useEffect(() => {
        if (cartCount === 0) {
            setPricingInfo(null);
            return undefined;
        }

        let cancelado = false;
        const timer = setTimeout(async () => {
            try {
                const r = await getPricing(cartCount, normalizedRutaId);
                if (cancelado) return;
                if (r.ok) {
                    setPricingInfo({
                        ok: true,
                        cantidad: r.cantidad,
                        precioBase: r.precioUnitario,
                        precioBaseTotal: r.subtotal,
                        porcentajeDescuento: r.porcentajeDescuento,
                        descuentoTotal: r.montoDescuento,
                        totalPagar: r.total,
                        ahorros: r.montoDescuento,
                        cobro: r.cobro || null,
                        _isFallback: r._isFallback || false
                    });
                } else {
                    setPricingInfo(null);
                }
            } catch (err) {
                if (!cancelado) setPricingInfo({ ok: false, error: err.message || 'No se pudo obtener el precio' });
            }
        }, 250);

        return () => { cancelado = true; clearTimeout(timer); };
    }, [cartCount, normalizedRutaId]);

    // Clic en un asiento. Elegir uno libre es INSTANTÁNEO (estado local); solo
    // liberar un asiento ya bloqueado toca la red.
    const handleSeatClick = useCallback(async (seat) => {
        if (!seat || busy) return;
        setError(null);

        if (seat.status === 'heldByMe') {
            const hold = myHolds.find(h => h.asiento === seat.number);
            if (!hold) return;
            setBusy(true);
            const result = await deleteHold({ holdIds: [hold.holdId] });
            setBusy(false);
            if (result.ok) {
                setMyHolds(prev => prev.filter(h => h.holdId !== hold.holdId));
                loadSeats({ silent: true });
            } else {
                setError(result.error || 'No se pudo liberar el asiento');
            }
            return;
        }

        if (seat.status !== 'available') return;

        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(seat.number)) {
                next.delete(seat.number);
                return next;
            }
            if (next.size + myHolds.length >= MAX_ASIENTOS) {
                setError(`Máximo ${MAX_ASIENTOS} asientos por reserva. Quita alguno para elegir otro.`);
                return prev;
            }
            next.add(seat.number);
            return next;
        });
    }, [busy, myHolds, loadSeats]);

    const removePicked = (numero) => setPicked((prev) => {
        const next = new Set(prev);
        next.delete(numero);
        return next;
    });

    /**
     * Bloquea en la API los asientos elegidos, TODOS en una sola llamada.
     *
     * Es lo que permite que la API valide la regla sobre el conjunto (máximo de
     * asientos y razón social desde 5). Devuelve la lista completa de holds
     * (los que ya había + los nuevos) o null si la API los rechazó.
     */
    const reserveSelected = async () => {
        if (pickedList.length === 0) return myHolds;

        const result = await createHold({
            rutaId: normalizedRutaId,
            fecha,
            seatNumbers: pickedList,
            companyName: company.trim() || undefined
        });

        setDebugData((prev) => ({ ...prev, lastHoldResponse: result, timestamp: new Date().toISOString() }));

        if (!result.ok) {
            setError(result.error || 'No se pudieron bloquear los asientos');
            await loadSeats({ silent: true });
            return null;
        }

        const nuevos = (result.holds && result.holds.length
            ? result.holds
            : (result.holdIds || [result.holdId]).map((holdId, i) => ({ holdId, asiento: (result.asientos || pickedList)[i] }))
        ).map(h => ({
            holdId: h.holdId,
            asiento: h.asiento,
            rutaId: normalizedRutaId,
            fecha: String(fecha),
            expiresAt: result.expiresAt,
            remainingMs: result.remainingMs,
            companyName: company.trim() || null
        }));

        const todos = [...myHolds, ...nuevos];
        setMyHolds(todos);
        setPicked(new Set());
        return todos;
    };

    // Pagar: bloquea el conjunto, crea la orden en la API y envía a PayPal.
    const handlePagar = async () => {
        if (!companyOk) {
            setError(`Para ${RAZON_SOCIAL_DESDE} asientos o más debes indicar la razón social.`);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const holds = await reserveSelected();
            if (!holds) return;
            const orden = await crearOrdenPago(holds.map((hold) => hold.holdId));
            window.location.assign(orden.approvalUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    // Confirmar sin pago en línea (cambio de asiento desde "Mis reservas").
    const handleConfirm = async () => {
        if (!companyOk) {
            setError(`Para ${RAZON_SOCIAL_DESDE} asientos o más debes indicar la razón social.`);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const holds = await reserveSelected();
            if (!holds) return;

            const results = await Promise.all(holds.map(hold =>
                confirmReserva({ holdId: hold.holdId, rutaId: hold.rutaId, fecha: hold.fecha, asiento: hold.asiento })
            ));
            const successful = results.filter(r => r.ok);
            const failed = results.filter(r => !r.ok);

            if (successful.length === 0) {
                setError('No se pudo confirmar ninguna reserva');
                return;
            }

            setPopupMessage({
                title: 'Reservas confirmadas',
                message: `¡${successful.length} reserva${successful.length > 1 ? 's' : ''} confirmada${successful.length > 1 ? 's' : ''}!`,
                variant: 'success'
            });

            const completeResult = {
                ok: true,
                asientos: holds.map(h => h.asiento),
                rutaId: holds[0]?.rutaId,
                fecha: holds[0]?.fecha,
                precio: pricingInfo?.ok ? {
                    precioBase: pricingInfo.precioBase,
                    cantidadAsientos: pricingInfo.cantidad,
                    precioBaseTotal: pricingInfo.precioBaseTotal,
                    descuento: pricingInfo.descuentoTotal,
                    descuentoTotal: pricingInfo.descuentoTotal,
                    recargo: 0,
                    recargoTotal: 0,
                    totalPagar: pricingInfo.totalPagar
                } : null,
                results: successful
            };

            setMyHolds([]);
            setPricingInfo(null);
            await loadSeats({ silent: true });
            if (onReservationComplete) onReservationComplete(completeResult);

            if (failed.length > 0) {
                setPopupMessage({
                    title: 'Confirmación parcial',
                    message: `Advertencia: ${failed.length} reserva${failed.length > 1 ? 's' : ''} no se pudieron confirmar.`,
                    variant: 'warning'
                });
            }
        } catch (err) {
            setError(err.message || 'Error al confirmar reservas');
        } finally {
            setBusy(false);
        }
    };

    // Vaciar: la selección local se borra al instante; los bloqueos ya hechos piden confirmación.
    const handleCancelAll = () => {
        if (myHolds.length > 0) {
            setConfirmCancelOpen(true);
        } else {
            setPicked(new Set());
            setCompany('');
        }
    };

    const confirmCancelAll = async () => {
        setConfirmCancelOpen(false);
        setBusy(true);
        const result = await deleteHold({ holdIds: myHolds.map(h => h.holdId) });
        setBusy(false);
        if (result.ok) {
            setMyHolds([]);
            setPicked(new Set());
            setCompany('');
            setPricingInfo(null);
            loadSeats({ silent: true });
        } else {
            setError(result.error || 'No se pudieron liberar los asientos');
        }
    };

    // Un solo cronómetro: el del bloqueo que vence antes.
    const proximoVencimiento = useMemo(() => {
        const conFecha = myHolds.filter(h => h.expiresAt);
        if (conFecha.length === 0) return myHolds[0] || null;
        return conFecha.reduce((a, b) => (new Date(a.expiresAt) <= new Date(b.expiresAt) ? a : b));
    }, [myHolds]);

    const handleTimerExpire = useCallback(() => {
        setMyHolds([]);
        loadSeats({ silent: true });
    }, [loadSeats]);

    const resumen = {
        libres: seats.filter(s => s.status === 'available').length - picked.size,
        mios: heldList.length + picked.size,
        otros: seats.filter(s => s.status === 'heldByOther').length,
        vendidos: seats.filter(s => s.status === 'reserved').length
    };
    const puedePagar = cartCount > 0 && !busy && pricingInfo?.ok && companyOk;

    return (
        <div className="bus-seat-selector">
            <ConfirmPopup
                open={confirmCancelOpen}
                onCancel={() => setConfirmCancelOpen(false)}
                onConfirm={confirmCancelAll}
                title="¿Liberar los asientos bloqueados?"
                message={`Se liberarán ${myHolds.length} asiento${myHolds.length > 1 ? 's' : ''} que ya tenías bloqueado${myHolds.length > 1 ? 's' : ''}.`}
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
                    <p>Fecha de viaje: {String(fecha || '')} · máximo {MAX_ASIENTOS} asientos</p>
                </div>
                {onClose && (
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar">
                        <Icon name="x" size={20} />
                    </button>
                )}
            </div>

            {error && (
                <div className="error-banner" role="alert">
                    <span><Icon name="alert" size={16} /> {error}</span>
                    <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso"><Icon name="x" size={16} /></button>
                </div>
            )}

            {loading && seats.length === 0 && (
                <div className="loading-overlay"><Icon name="loader" size={16} className="spin" /> Cargando el mapa…</div>
            )}

            <BusGrid seats={seats} picked={picked} busy={busy} onSeatClick={handleSeatClick} />

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

            {/* Carrito fijo abajo: siempre visible mientras se elige en el mapa */}
            <div className={`cart-panel${cartCount === 0 ? ' cart-panel--empty' : ''}`}>
                {cartCount === 0 ? (
                    <p className="cart-panel__hint">
                        <Icon name="seat" size={16} /> Toca los asientos libres para elegirlos. Con {RAZON_SOCIAL_DESDE} o más se aplica el descuento corporativo.
                    </p>
                ) : (
                    <>
                        <div className="cart-panel__head">
                            <strong><Icon name="seat" size={16} /> {cartCount} asiento{cartCount > 1 ? 's' : ''}</strong>
                            {proximoVencimiento && (
                                <span className="cart-panel__timer" title="Tiempo para completar el pago de los asientos ya bloqueados">
                                    <HoldTimer
                                        expiresAt={proximoVencimiento.expiresAt}
                                        remainingMs={proximoVencimiento.remainingMs}
                                        onExpire={handleTimerExpire}
                                    />
                                </span>
                            )}
                        </div>

                        <div className="seat-chips">
                            {[...heldList.map(n => ({ n, held: true })), ...pickedList.map(n => ({ n, held: false }))]
                                .sort((a, b) => a.n - b.n)
                                .map(({ n, held }) => (
                                    <span key={n} className={`seat-chip${held ? ' seat-chip--held' : ''}`}>
                                        {n} <small>{posicionAsiento(n) === 'Ventana' ? 'vent' : 'pas'}</small>
                                        {!held && (
                                            <button type="button" onClick={() => removePicked(n)} aria-label={`Quitar el asiento ${n}`}>
                                                <Icon name="x" size={11} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                        </div>

                        {needsCompany && !myHolds.some(h => h.companyName) && (
                            <div className="company-field">
                                <label htmlFor="razon-social">Razón social <span>(obligatoria desde {RAZON_SOCIAL_DESDE} asientos)</span></label>
                                <input
                                    id="razon-social"
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Viajes Nova S.A."
                                    autoComplete="organization"
                                    aria-invalid={!companyOk}
                                    className={!companyOk ? 'is-invalid' : ''}
                                />
                            </div>
                        )}

                        {pricingInfo?.ok ? (
                            <div className="pricing-panel">
                                <dl className="pricing-rows">
                                    <div><dt>{formatoUSD(pricingInfo.precioBase)} × {pricingInfo.cantidad}</dt><dd>{formatoUSD(pricingInfo.precioBaseTotal)}</dd></div>
                                    {pricingInfo.porcentajeDescuento > 0 && (
                                        <div className="pricing-rows__save">
                                            <dt>Descuento {pricingInfo.porcentajeDescuento}%</dt>
                                            <dd>−{formatoUSD(pricingInfo.descuentoTotal)}</dd>
                                        </div>
                                    )}
                                </dl>
                                <div className="pricing-total">
                                    <span>Total a pagar</span>
                                    <strong>{formatoUSD(pricingInfo.totalPagar)}</strong>
                                </div>
                                {pricingInfo.cobro?.valor && (
                                    <div className="pricing-charge">Se cobrarán {pricingInfo.cobro.valor} {pricingInfo.cobro.moneda} en PayPal</div>
                                )}
                            </div>
                        ) : (
                            <div className="pricing-loading"><Icon name="loader" size={14} className="spin" /> Calculando precio…</div>
                        )}

                        <div className="hold-actions">
                            <button
                                type="button"
                                className="btn btn-confirm"
                                onClick={modoPago ? handlePagar : handleConfirm}
                                disabled={!puedePagar}
                                title={!pricingInfo?.ok ? 'Calculando precio...' : (!companyOk ? 'Indica la razón social' : '')}
                            >
                                {busy
                                    ? <><Icon name="loader" size={16} className="spin" /> Procesando…</>
                                    : modoPago
                                        ? <><Icon name="card" size={16} /> Pagar {pricingInfo?.ok ? formatoUSD(pricingInfo.totalPagar) : ''} con PayPal</>
                                        : <><Icon name="check" size={16} /> Confirmar {cartCount} reserva{cartCount > 1 ? 's' : ''}</>}
                            </button>
                            <button type="button" className="btn btn-cancel" onClick={handleCancelAll} disabled={busy}>
                                <Icon name="x" size={16} /> Vaciar
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="actions-bar">
                <button type="button" className="btn btn-refresh" onClick={() => loadSeats()} disabled={loading || busy}>
                    <Icon name="refresh" size={16} className={loading ? 'spin' : ''} /> Actualizar
                </button>
                <button type="button" className="btn btn-refresh" onClick={() => setShowDebug(!showDebug)}>
                    <Icon name="search" size={16} /> Datos de la API
                </button>
            </div>

            {showDebug && (
                <div className="api-debug">
                    <div className="api-debug__head">
                        <strong>Datos de la API (depuración)</strong>
                        <button type="button" onClick={() => setShowDebug(false)}>Cerrar</button>
                    </div>
                    <details open><summary>GET /api/asientos/disponibles</summary>
                        <pre>{JSON.stringify(debugData?.disponibles || apiResponse?.disponibles || {}, null, 2)}</pre></details>
                    <details open><summary>GET /api/asientos/holds</summary>
                        <pre>{JSON.stringify(debugData?.holds || apiResponse?.holds || {}, null, 2)}</pre></details>
                    {debugData?.lastHoldResponse && (
                        <details open><summary>POST /api/asientos/reservar (último bloqueo)</summary>
                            <pre>{JSON.stringify(debugData.lastHoldResponse, null, 2)}</pre></details>
                    )}
                    {pricingInfo && (
                        <details open><summary>POST /api/pricing/calcular-precio</summary>
                            <pre>{JSON.stringify(pricingInfo, null, 2)}</pre></details>
                    )}
                </div>
            )}
        </div>
    );
};

export default BusSeatSelector;
