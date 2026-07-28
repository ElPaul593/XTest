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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h2 style={{ marginTop: 0, marginBottom: '6px' }}>🎫 Tu boleto</h2>
        <p style={{ margin: '0 0 16px', color: '#555' }}>{origen} ➜ {destino}</p>

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

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
          Presenta este código QR al abordar para validar tu reserva.
        </p>
      </div>
    </div>
  );
}
