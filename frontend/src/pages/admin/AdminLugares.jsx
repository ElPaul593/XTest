import React, { useCallback, useEffect, useState } from 'react';
import {
  createLugarTuristico,
  deleteLugarTuristico,
  getAllLugaresTuristicos,
  updateLugarTuristico,
} from '../../services/lugaresTuristicosAdmin';
import useFeedback from '../../hooks/useFeedback';

const emptyForm = {
  nombre: '',
  ciudad: '',
  direccion: '',
  descripcion: '',
  tipo: 'Museo',
  horario: '',
  precioEntrada: '',
  imagen: '',
};

const TIPOS_LUGAR = ['Museo', 'Parque', 'Monumento', 'Playa', 'Montaña', 'Centro Histórico', 'Otro'];
const PAGE_SIZE = 10;

export default function AdminLugares() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [page, setPage] = useState(1);
  const { aviso, mostrarExito, mostrarError } = useFeedback();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLugaresTuristicos();
      setLugares(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ciudades = [...new Set(lugares.map((lugar) => lugar.ciudad).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const filteredLugares = lugares.filter((lugar) => {
    const matchesSearch = !search
      || `${lugar.nombre} ${lugar.ciudad} ${lugar.tipo || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!filterCity || lugar.ciudad === filterCity);
  });
  const totalPages = Math.max(1, Math.ceil(filteredLugares.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLugares = filteredLugares.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (lugar) => {
    const id = lugar._id || lugar.id;
    setEditingId(id);
    setForm({
      nombre: lugar.nombre || '',
      ciudad: lugar.ciudad || '',
      direccion: lugar.direccion || '',
      descripcion: lugar.descripcion || '',
      tipo: lugar.tipo || 'Museo',
      horario: lugar.horario || '',
      precioEntrada: lugar.precioEntrada ?? '',
      imagen: lugar.imagen || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim(),
      direccion: form.direccion.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      horario: form.horario.trim(),
      precioEntrada: Number(form.precioEntrada),
      imagen: form.imagen.trim(),
    };

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        await updateLugarTuristico(editingId, payload);
      } else {
        await createLugarTuristico(payload);
      }

      closeModal();
      await load();
      mostrarExito(editingId ? 'El lugar turístico se actualizó correctamente.' : 'El lugar turístico se creó correctamente.', editingId ? 'Lugar actualizado' : 'Lugar creado');
    } catch (e) {
      setError(e.message);
      mostrarError(e, 'No se pudo guardar el lugar turístico');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lugar) => {
    const id = lugar._id || lugar.id;
    /**
     * #33BUG — Avisos con el diálogo nativo del navegador en lugar de una ventana
     * emergente de la aplicación.
     *
     * Esta pantalla usa 1 llamada nativa. Un `window.confirm` para borrar un lugar turístico, que además es un borrado físico.
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
    if (!window.confirm(`¿Eliminar el lugar "${lugar.nombre}"?`)) return;

    try {
      setError(null);
      await deleteLugarTuristico(id);
      await load();
      mostrarExito('El lugar turístico se eliminó correctamente.', 'Lugar eliminado');
    } catch (e) {
      setError(e.message);
      mostrarError(e, 'No se pudo eliminar el lugar turístico');
    }
  };

  return (
    <div>
      {aviso && (
        <div className={`admin-feedback admin-feedback--${aviso.variant}`} role="status">
          <strong>{aviso.title}</strong>
          <span>{aviso.message}</span>
        </div>
      )}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2>Lugares turísticos</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              CRUD de lugares turísticos con imagen por URL, protegido por el backend existente.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Agregar lugar
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2>Listado ({filteredLugares.length} de {lugares.length})</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="input" placeholder="Buscar lugar..." value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} />
            <select className="input" value={filterCity} onChange={e => { setPage(1); setFilterCity(e.target.value); }} aria-label="Filtrar por ciudad">
              <option value="">Todas las ciudades</option>
              {ciudades.map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : lugares.length === 0 ? (
          <div className="empty-state">
            <p>No hay lugares turísticos registrados.</p>
          </div>
        ) : filteredLugares.length === 0 ? (
          <div className="empty-state">
            <p>No hay lugares que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLugares.map((lugar) => {
                  const id = lugar._id || lugar.id;
                  return (
                    <tr key={id}>
                      <td>
                        {lugar.imagen ? (
                          <img
                            src={lugar.imagen}
                            alt={lugar.nombre}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface-light)' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px', background: 'var(--surface-light)' }}>
                            Sin foto
                          </div>
                        )}
                      </td>
                      <td>{lugar.nombre}</td>
                      <td>{lugar.ciudad}</td>
                      <td>{lugar.tipo || 'Otro'}</td>
                      <td>{typeof lugar.precioEntrada === 'number' ? `$${lugar.precioEntrada.toFixed(2)}` : '$0.00'}</td>
                      <td>
                        <div className="action-buttons">
                          <button type="button" className="btn btn-secondary" onClick={() => openEditModal(lugar)}>
                            Editar
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => handleDelete(lugar)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredLugares.length > PAGE_SIZE && (
          <div className="pagination">
            <button disabled={currentPage <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px', width: '92%' }}>
            <h2>{editingId ? 'Editar lugar turístico' : 'Agregar lugar turístico'}</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Nombre</label>
                  <input
                    className="input"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre del lugar"
                    required
                  />
                </div>

                <div className="field">
                  <label>Ciudad</label>
                  <input
                    className="input"
                    value={form.ciudad}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                    placeholder="Quito"
                    required
                  />
                </div>

                <div className="field">
                  <label>Tipo</label>
                  <select
                    className="input"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    required
                  >
                    {TIPOS_LUGAR.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Precio de entrada</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precioEntrada}
                    onChange={(e) => setForm({ ...form, precioEntrada: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Dirección</label>
                  <input
                    className="input"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Dirección exacta"
                    required
                  />
                </div>

                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción</label>
                  <textarea
                    className="input"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Describe el lugar"
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label>Horario</label>
                  <input
                    className="input"
                    value={form.horario}
                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                    placeholder="Lun - Dom 08:00 - 18:00"
                    required
                  />
                </div>

                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Imagen URL</label>
                  <input
                    className="input"
                    value={form.imagen}
                    onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar lugar' : 'Crear lugar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}