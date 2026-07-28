import React, { useEffect, useState, useCallback } from 'react';
import { getRutas, createRuta, deleteRuta } from '../../services/rutas';

const emptyForm = { from: '', to: '', price: '', duration: '', seats: 40 };

export default function AdminRutas() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRutas();
      setRutas(Array.isArray(res) ? res : res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createRuta({
        from: form.from.trim(),
        to: form.to.trim(),
        price: Number(form.price),
        duration: form.duration.trim(),
        seats: Number(form.seats) || 40
      });
      setForm(emptyForm);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta ruta?')) return;
    try {
      await deleteRuta(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="dashboard-section">
        <h2>Nueva ruta</h2>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>Precio en USD (entre 3 y 20). El nombre se genera como "Origen - Destino".</p>
        <form onSubmit={handleCreate} className="user-form">
          <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <input className="input" placeholder="Origen" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required />
            <input className="input" placeholder="Destino" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required />
            <input className="input" type="number" min="3" max="20" step="0.5" placeholder="Precio (USD)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            <input className="input" placeholder="Duración (ej: 4 horas)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required />
            <input className="input" type="number" min="1" max="80" placeholder="Asientos" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
            <button type="submit" className="btn btn-primary">Crear ruta</button>
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <h2>Rutas ({rutas.length})</h2>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : rutas.length === 0 ? (
          <div className="empty-state"><p>No hay rutas.</p></div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr><th>Origen</th><th>Destino</th><th>Precio</th><th>Duración</th><th>Asientos</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {rutas.map(r => {
                  const id = r._id || r.id;
                  return (
                    <tr key={id}>
                      <td>{r.from}</td>
                      <td>{r.to}</td>
                      <td>${r.price}</td>
                      <td>{r.duration}</td>
                      <td>{r.seats}</td>
                      <td>
                        <button className="btn btn-ghost" onClick={() => handleDelete(id)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
