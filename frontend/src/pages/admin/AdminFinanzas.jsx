import React, { useCallback, useEffect, useState } from 'react';
import {
  aprobarPago,
  getPagosPendientes,
  getResumenFinanciero,
  rechazarPago
} from '../../services/pagos';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const nombreRuta = (ruta) => (ruta ? `${ruta.from} → ${ruta.to}` : 'Ruta no disponible');
const nombreCliente = (user) =>
  [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || user?.cedula || 'Cliente';

function Dato({ titulo, valor, nota }) {
  return (
    <div className="finanzas-dato">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {nota && <small>{nota}</small>}
    </div>
  );
}

export default function AdminFinanzas() {
  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [motivos, setMotivos] = useState({});
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [datos, pagos] = await Promise.all([getResumenFinanciero(), getPagosPendientes()]);
      setResumen(datos);
      setPendientes(pagos);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (orderId, accion) => {
    setProcesando(orderId);
    setError('');
    try {
      await accion();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  if (!resumen) {
    return error
      ? <p className="finanzas-error">{error}</p>
      : <p>Cargando finanzas...</p>;
  }

  const { ventas, pasarela } = resumen;

  return (
    <div className="finanzas">
      {error && <p className="finanzas-error">{error}</p>}

      <h2>Ingresos y egresos</h2>
      <div className="finanzas-datos">
        <Dato titulo="Ventas en CulturalTrip" valor={dinero(ventas.total)} nota={`${ventas.cantidad} pagos confirmados`} />
        {pasarela ? (
          <>
            <Dato titulo="Ingresos en PayPal" valor={dinero(pasarela.ingresos)} nota="Últimos 30 días" />
            <Dato titulo="Egresos en PayPal" valor={dinero(pasarela.egresos)} nota={`Comisiones ${dinero(pasarela.comisiones)} · Retiros ${dinero(pasarela.retiros)}`} />
            <Dato
              titulo={`Saldo${pasarela.modo === 'sandbox' ? ' (pruebas)' : ''}`}
              valor={dinero(pasarela.saldos[0]?.disponible)}
              nota={pasarela.saldos[0]?.moneda}
            />
          </>
        ) : (
          <Dato titulo="PayPal" valor="Sin conexión" nota="No se pudo consultar la cuenta" />
        )}
      </div>

      <h2>Pagos por revisar ({pendientes.length})</h2>
      {pendientes.length === 0 ? (
        <p className="finanzas-vacio">No hay pagos pendientes.</p>
      ) : pendientes.map((pago) => (
        <article key={pago.orderId} className="finanzas-pago">
          <div>
            <strong>{nombreCliente(pago.user)}</strong>
            <span>{nombreRuta(pago.ruta)} · {pago.fecha} · Asientos {pago.asientos.join(', ')}</span>
            <span>{dinero(pago.total)} {pago.moneda}{pago.pagador ? ` · ${pago.pagador}` : ''}</span>
          </div>
          <input
            className="input"
            aria-label="Motivo del rechazo"
            placeholder="Motivo (si rechazas)"
            value={motivos[pago.orderId] || ''}
            onChange={(e) => setMotivos((prev) => ({ ...prev, [pago.orderId]: e.target.value }))}
          />
          <div className="finanzas-acciones">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={procesando === pago.orderId}
              onClick={() => resolver(pago.orderId, () => aprobarPago(pago.orderId))}
            >
              Aprobar
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={procesando === pago.orderId}
              onClick={() => resolver(pago.orderId, () => rechazarPago(pago.orderId, motivos[pago.orderId]))}
            >
              Rechazar
            </button>
          </div>
        </article>
      ))}

      <h2>Últimas ventas</h2>
      {ventas.ultimas.length === 0 ? (
        <p className="finanzas-vacio">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="finanzas-tabla">
          <table className="users-table">
            <thead>
              <tr><th>Ruta</th><th>Viaje</th><th>Asientos</th><th>Total</th></tr>
            </thead>
            <tbody>
              {ventas.ultimas.map((venta) => (
                <tr key={venta.orderId}>
                  <td>{nombreRuta(venta.ruta)}</td>
                  <td>{venta.fecha}</td>
                  <td>{venta.asientos.join(', ')}</td>
                  <td>{dinero(venta.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pasarela?.movimientos.length > 0 && (
        <>
          <h2>Movimientos de PayPal</h2>
          <div className="finanzas-tabla">
            <table className="users-table">
              <thead>
                <tr><th>Fecha</th><th>Concepto</th><th>Importe</th><th>Comisión</th></tr>
              </thead>
              <tbody>
                {pasarela.movimientos.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td>{new Date(movimiento.fecha).toLocaleDateString('es-EC')}</td>
                    <td>{movimiento.concepto || (Number(movimiento.importe) < 0 ? 'Retiro' : 'Cobro')}</td>
                    <td>{movimiento.importe} {movimiento.moneda}</td>
                    <td>{movimiento.comision || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
