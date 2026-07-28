import React, { useEffect, useState, useCallback } from 'react';
import { getAllReservations } from '../../services/reservas';
import { getBoletos, createBoleto } from '../../services/boletos';

export default function AdminBoletos() {
  const [reservas, setReservas] = useState([]);
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reservaId, setReservaId] = useState('');
  const [seatNumber, setSeatNumber] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resReservas, resBoletos] = await Promise.all([
        getAllReservations(1, 100, { status: 'reserved' }),
        getBoletos()
      ]);
      setReservas(resReservas.data || []);
      setBoletos(Array.isArray(resBoletos) ? resBoletos : resBoletos.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedReserva = reservas.find(r => (r.id || r._id) === reservaId);
  const seatOptions = selectedReserva
    ? (Array.isArray(selectedReserva.seatNumbers) && selectedReserva.seatNumbers.length > 0
        ? selectedReserva.seatNumbers
        : (selectedReserva.seatNumber ? [selectedReserva.seatNumber] : []))
    : [];

  const handleEmit = async (e) => {
    e.preventDefault();
    if (!reservaId || !seatNumber) {
      alert('Selecciona una reserva y un asiento');
      return;
    }
    try {
      await createBoleto({ reserva: reservaId, seatNumber: Number(seatNumber) });
      setReservaId('');
      setSeatNumber('');
      alert('Boleto emitido correctamente');
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const reservaLabel = (r) => {
    const ruta = r.ruta || {};
    const seats = Array.isArray(r.seatNumbers) && r.seatNumbers.length ? r.seatNumbers.join(',') : r.seatNumber;
    const userName = r.user && typeof r.user === 'object' ? `${r.user.nombre || ''} ${r.user.apellido || ''}`.trim() : '';
    return `${ruta.from || '?'} ➜ ${ruta.to || '?'} | asientos ${seats}${userName ? ' | ' + userName : ''}`;
  };

  return (
    <div>
      <div className="dashboard-section">
        <h2>Emitir boleto</h2>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>El precio se calcula automáticamente según la ruta y la estrategia de pricing.</p>
        <form onSubmit={handleEmit} className="user-form">
          <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <select className="input" value={reservaId} onChange={e => { setReservaId(e.target.value); setSeatNumber(''); }} style={{ minWidth: '320px' }}>
              <option value="">-- Selecciona una reserva --</option>
              {reservas.map(r => (
                <option key={r.id || r._id} value={r.id || r._id}>{reservaLabel(r)}</option>
              ))}
            </select>
            <select className="input" value={seatNumber} onChange={e => setSeatNumber(e.target.value)} disabled={!reservaId}>
              <option value="">-- Asiento --</option>
              {seatOptions.map(s => <option key={s} value={s}>#{s}</option>)}
            </select>
            <button type="submit" className="btn btn-primary" disabled={!reservaId || !seatNumber}>Emitir</button>
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <h2>Boletos emitidos ({boletos.length})</h2>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : boletos.length === 0 ? (
          <div className="empty-state"><p>Aún no hay boletos emitidos.</p></div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr><th>ID Boleto</th><th>Reserva</th><th>Asiento</th><th>Precio</th><th>Emitido</th></tr>
              </thead>
              <tbody>
                {boletos.map(b => (
                  <tr key={b.id || b._id}>
                    <td>{b.id || b._id}</td>
                    <td>{typeof b.reserva === 'object' && b.reserva ? (b.reserva.id || b.reserva._id) : b.reserva}</td>
                    <td>#{b.seatNumber}</td>
                    <td>${Number(b.price).toFixed(2)}</td>
                    <td>{b.issuedAt ? new Date(b.issuedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
