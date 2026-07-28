import React, { useEffect, useState, useCallback } from 'react';
import { getReservasStats } from '../../services/stats';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReservasStats({ from: from || undefined, to: to || undefined });
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const card = (label, value, color) => (
    <div style={{ flex: '1 1 180px', background: color, color: 'white', borderRadius: '12px', padding: '18px' }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{value}</div>
      <div style={{ opacity: 0.9 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="dashboard-section">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px' }}>Desde</label>
            <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px' }}>Hasta</label>
            <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={load}>Aplicar</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="loading-spinner"></div>
      ) : stats ? (
        <>
          <div className="dashboard-section">
            <h2>Resumen</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {card('Total reservas', stats.general?.totalReservas ?? 0, '#2d3a8c')}
              {card('Activas', stats.general?.reservasActivas ?? 0, '#11998e')}
              {card('Canceladas', stats.general?.reservasCanceladas ?? 0, '#e74c3c')}
              {card('Tasa cancelación', stats.general?.tasaCancelacion ?? '0%', '#f39c12')}
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Por ruta</h2>
            {(!stats.porRuta || stats.porRuta.length === 0) ? (
              <div className="empty-state"><p>Sin datos.</p></div>
            ) : (
              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr><th>Ruta</th><th>Total</th><th>Activas</th><th>Canceladas</th></tr>
                  </thead>
                  <tbody>
                    {stats.porRuta.map((r, i) => (
                      <tr key={i}>
                        <td>{r.route?.from} ➜ {r.route?.to}</td>
                        <td>{r.totalReservas}</td>
                        <td>{r.reservasActivas}</td>
                        <td>{r.reservasCanceladas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Por mes</h2>
            {(!stats.porMes || stats.porMes.length === 0) ? (
              <div className="empty-state"><p>Sin datos.</p></div>
            ) : (
              <div className="table-container">
                <table className="users-table">
                  <thead><tr><th>Año</th><th>Mes</th><th>Reservas</th></tr></thead>
                  <tbody>
                    {stats.porMes.map((m, i) => (
                      <tr key={i}><td>{m.year}</td><td>{m.month}</td><td>{m.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
