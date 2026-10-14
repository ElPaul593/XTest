import React, { useEffect, useState, useCallback } from 'react';
import { getRutas, createRuta, updateRuta, deleteRuta } from '../../services/rutas';

const emptyForm = { from: '', to: '', price: '', duration: '', horaSalida: '08:00', seats: 40 };

export default function AdminRutas() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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
      const payload = {
        from: form.from.trim(),
        to: form.to.trim(),
        price: Number(form.price),
        duration: Number(form.duration),
        horaSalida: form.horaSalida.trim(),
        seats: Number(form.seats) || 40
      };
      if (editingId) await updateRuta(editingId, payload);
      else await createRuta(payload);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      /**
       * #33BUG — Avisos con el diálogo nativo del navegador en lugar de una ventana
       * emergente de la aplicación.
       *
       * Esta pantalla usa 3 llamadas nativas. Dos `alert` de error y un `window.confirm` para borrar una ruta.
       *
       * Tres problemas concretos:
       *
       *  1. `alert()` y `confirm()` bloquean el hilo principal: mientras el diálogo
       *     está abierto, React no puede repintar ni se ejecutan los temporizadores.
       *     En las pantallas de asientos eso congela el contador del hold.
       *  2. El navegador los pinta con su propio estilo, ajeno al negro + amarillo del
       *     proyecto, y antepone el dominio ("localhost:3000 dice…").
       *  3. No admiten formato ni contenido enriquecido, así que los mensajes largos
       *     se apelmazan y los saltos de línea con `\n` se ven de forma distinta en
       *     cada navegador.
       *
       * Sustitución disponible: `components/Popup.jsx` (`AlertPopup` para avisar,
       * `ConfirmPopup` para confirmar) junto al hook `hooks/useFeedback.js`. Se
       * renderizan con `createPortal` sobre `document.body` y en la capa `--z-modal`,
       * por encima del navbar fijo. Ya están aplicados en `LoginForm`, `Profile`,
       * `Dashboard` y `admin/AdminUsers` y pueden servir de referencia.
       *
       * NO se corrige aquí por indicación expresa: solo se documenta.
       */
      alert(e.message);
    }
  };

  const startEdit = (ruta) => {
    setEditingId(ruta._id || ruta.id);
    const numericDuration = String(ruta.duration || '').match(/\d+(?:\.\d+)?/)?.[0] || '';
    setForm({
      from: ruta.from || '',
      to: ruta.to || '',
      price: ruta.price ?? '',
      duration: numericDuration,
      horaSalida: ruta.horaSalida || '08:00',
      seats: ruta.seats || 40
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  let tableContent;
  if (loading) {
    tableContent = <div className="loading-spinner"></div>;
  } else if (rutas.length === 0) {
    tableContent = <div className="empty-state"><p>No hay rutas.</p></div>;
  } else {
    tableContent = (
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr><th>Origen</th><th>Destino</th><th>Precio</th><th>Duración</th><th>Salida</th><th>Asientos</th><th>Acciones</th></tr>
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
                  <td>{r.horaSalida || '08:00'}</td>
                  <td>{r.seats}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => startEdit(r)}>Editar</button>
                    <button className="btn btn-ghost" onClick={() => handleDelete(id)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

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
            <input className="input" type="number" min="1" max="16" step="0.5" placeholder="Duración (horas)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required />
            <input className="input" type="time" value={form.horaSalida} onChange={e => setForm({ ...form, horaSalida: e.target.value })} required />
            <input className="input" type="number" min="1" max="80" placeholder="Asientos" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
            <button type="submit" className="btn btn-primary">{editingId ? 'Guardar cambios' : 'Crear ruta'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <h2>Rutas ({rutas.length})</h2>
        {error && <div className="error-message">{error}</div>}
        {tableContent}
      </div>
    </div>
  );
}
