import React, { useEffect, useState, useCallback } from 'react';
import { getRutas, getCiudadesRutas, createRuta, updateRuta, deleteRuta } from '../../services/rutas';
import useFeedback from '../../hooks/useFeedback';

const emptyForm = { from: '', to: '', price: '', duration: '', horaSalida: '08:00', seats: 40 };

const preventNonNumericKeys = (event) => {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
};

const onlyDecimalInput = (value) => value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
const onlyIntegerInput = (value) => value.replace(/\D/g, '');
const PAGE_SIZE = 10;

export default function AdminRutas() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [ciudades, setCiudades] = useState([]);
  const [search, setSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);
  const { aviso, mostrarExito, mostrarError } = useFeedback();

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

  useEffect(() => {
    getCiudadesRutas().then(setCiudades).catch(() => setCiudades([]));
  }, []);

  const filteredRutas = rutas.filter((ruta) => {
    const matchesSearch = !search
      || `${ruta.from} ${ruta.to} ${ruta.name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFrom = !filterFrom || ruta.from === filterFrom;
    const matchesTo = !filterTo || ruta.to === filterTo;
    return matchesSearch && matchesFrom && matchesTo;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRutas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRutas = filteredRutas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
      mostrarExito(editingId ? 'La ruta se actualizó correctamente.' : 'La ruta se creó correctamente.', editingId ? 'Ruta actualizada' : 'Ruta creada');
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
      mostrarError(e, 'No se pudo guardar la ruta');
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
      mostrarExito('La ruta se eliminó correctamente.', 'Ruta eliminada');
    } catch (e) {
      mostrarError(e, 'No se pudo eliminar la ruta');
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
            {paginatedRutas.map(r => {
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
      {aviso && (
        <div className={`admin-feedback admin-feedback--${aviso.variant}`} role="status">
          <strong>{aviso.title}</strong>
          <span>{aviso.message}</span>
        </div>
      )}
      <div className="dashboard-section">
        <h2>Nueva ruta</h2>
        <p style={{ color: '#666', fontSize: '13px', marginTop: 0 }}>Precio en USD (entre 3 y 20). El nombre se genera como "Origen - Destino".</p>
        <form onSubmit={handleCreate} className="user-form">
          <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div className="field">
              <label htmlFor="ruta-origen">Origen</label>
              <select id="ruta-origen" className="input" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required>
                <option value="">Selecciona una ciudad</option>
                {ciudades.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ruta-destino">Destino</label>
              <select id="ruta-destino" className="input" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required>
                <option value="">Selecciona una ciudad</option>
                {ciudades.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ruta-precio">Precio (USD)</label>
              <input id="ruta-precio" className="input" type="number" inputMode="decimal" min="3" max="20" step="0.5" value={form.price} onKeyDown={preventNonNumericKeys} onChange={e => setForm({ ...form, price: onlyDecimalInput(e.target.value) })} required />
            </div>
            <div className="field">
              <label htmlFor="ruta-duracion">Duración (horas)</label>
              <input id="ruta-duracion" className="input" type="number" inputMode="decimal" min="1" max="16" step="0.5" value={form.duration} onKeyDown={preventNonNumericKeys} onChange={e => setForm({ ...form, duration: onlyDecimalInput(e.target.value) })} required />
            </div>
            <div className="field">
              <label htmlFor="ruta-salida">Hora de salida</label>
              <input id="ruta-salida" className="input" type="time" value={form.horaSalida} onChange={e => setForm({ ...form, horaSalida: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="ruta-asientos">Asientos</label>
              <input id="ruta-asientos" className="input" type="number" inputMode="numeric" min="1" max="80" value={form.seats} onKeyDown={preventNonNumericKeys} onChange={e => setForm({ ...form, seats: onlyIntegerInput(e.target.value) })} />
            </div>
            <button type="submit" className="btn btn-primary">{editingId ? 'Guardar cambios' : 'Crear ruta'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2>Rutas ({filteredRutas.length} de {rutas.length})</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="input" placeholder="Buscar ruta..." value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} />
            <select className="input" value={filterFrom} onChange={e => { setPage(1); setFilterFrom(e.target.value); }} aria-label="Filtrar por origen">
              <option value="">Todos los orígenes</option>
              {ciudades.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
            </select>
            <select className="input" value={filterTo} onChange={e => { setPage(1); setFilterTo(e.target.value); }} aria-label="Filtrar por destino">
              <option value="">Todos los destinos</option>
              {ciudades.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {filteredRutas.length === 0 && rutas.length > 0
          ? <div className="empty-state"><p>No hay rutas que coincidan con los filtros.</p></div>
          : tableContent}
        {filteredRutas.length > PAGE_SIZE && (
          <div className="pagination">
            <button disabled={currentPage <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
