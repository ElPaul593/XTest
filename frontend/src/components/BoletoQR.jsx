import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Muestra el QR de un boleto/reserva con la información del viaje.
 * El QR codifica un JSON con los datos clave de la reserva para verificación.
 */
export default function BoletoQR({ reserva, onClose }) {
  if (!reserva) return null;

  const id = reserva.id || reserva._id;
  const asientos = Array.isArray(reserva.seatNumbers) && reserva.seatNumbers.length > 0
    ? reserva.seatNumbers
    : (reserva.seatNumber ? [reserva.seatNumber] : []);
  const origen = reserva.ruta?.from || '';
  const destino = reserva.ruta?.to || '';
  const total = reserva.pricing?.total ?? reserva.precio?.totalPagar ?? reserva.ruta?.price ?? null;

  const payload = {
    boleto: id,
    ruta: `${origen} -> ${destino}`,
    asientos,
    fecha: reserva.fecha || null,
    estado: reserva.status,
    total
  };
  const qrText = JSON.stringify(payload);

  return (
    <div
      className="boleto-qr-overlay"
      onClick={onClose}
    >
      <div
        className="boleto-qr-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="boleto-qr-close"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h2>🎫 Tu boleto</h2>
        <p className="boleto-qr-route">{origen} ➜ {destino}</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <QRCodeSVG value={qrText} size={208} level="M" includeMargin />
        </div>

        <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: 1.7 }}>
          <div><strong>Código:</strong> {id}</div>
          <div><strong>Asiento(s):</strong> {asientos.length ? asientos.join(', ') : '—'}</div>
          {reserva.fecha && <div><strong>Fecha:</strong> {reserva.fecha}</div>}
          <div><strong>Estado:</strong> {reserva.status === 'reserved' ? 'Confirmada' : reserva.status}</div>
          {total != null && <div><strong>Total:</strong> ${Number(total).toFixed(2)}</div>}
        </div>

        <p className="boleto-qr-help">
          Presenta este código QR al abordar para validar tu reserva.
        </p>
      </div>
    </div>
  );
}
