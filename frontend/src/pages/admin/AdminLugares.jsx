import React, { useCallback, useEffect, useState } from 'react';
import {
  createLugarTuristico,
  deleteLugarTuristico,
  getAllLugaresTuristicos,
  updateLugarTuristico,
} from '../../services/lugaresTuristicosAdmin';

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

export default function AdminLugares() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lugar) => {
    const id = lugar._id || lugar.id;
    if (!window.confirm(`¿Eliminar el lugar "${lugar.nombre}"?`)) return;

    try {
      setError(null);
      await deleteLugarTuristico(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
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
        <h2>Listado ({lugares.length})</h2>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : lugares.length === 0 ? (
          <div className="empty-state">
            <p>No hay lugares turísticos registrados.</p>
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
                {lugares.map((lugar) => {
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