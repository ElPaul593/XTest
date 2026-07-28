import React, { useEffect, useState, useCallback } from 'react';
import { listUsers, createUser, updateUser, deleteUser } from '../../services/users';
import { getRutas } from '../../services/rutas';

const emptyCreate = { cedula: '', pasaporte: '', nombre: '', apellido: '', telefono: '', paisOrigen: 'Ecuador', password: '', role: 'USER' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyCreate);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', telefono: '', provincia: '', role: 'USER', password: '', assignedRutas: [] });
  const [rutas, setRutas] = useState([]);

  useEffect(() => {
    getRutas().then((r) => setRutas(Array.isArray(r) ? r : (r?.data || []))).catch(() => setRutas([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listUsers({ page, limit: 10, search: search || undefined });
      if (Array.isArray(res)) {
        setUsers(res);
        setPagination({ page: 1, totalPages: 1 });
      } else {
        setUsers(res.data || []);
        setPagination(res.pagination || { page: 1, totalPages: 1 });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // Enviar solo el identificador correcto según país
      if (payload.paisOrigen === 'Ecuador') delete payload.pasaporte;
      else delete payload.cedula;
      await createUser(payload);
      setForm(emptyCreate);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id || u.id);
    setEditForm({
      nombre: u.nombre || '', apellido: u.apellido || '', telefono: u.telefono || '',
      provincia: u.provincia || '', role: (u.role || 'USER').toUpperCase(), password: '',
      assignedRutas: Array.isArray(u.assignedRutas) ? u.assignedRutas.map((r) => String(r._id || r)) : []
    });
  };

  const toggleAssignedRuta = (rutaId) => {
    setEditForm((prev) => {
      const set = new Set(prev.assignedRutas || []);
      if (set.has(rutaId)) set.delete(rutaId); else set.add(rutaId);
      return { ...prev, assignedRutas: Array.from(set) };
    });
  };

  const saveEdit = async (id) => {
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      // Solo enviamos rutas asignadas para agentes; para otros roles las limpiamos.
      payload.assignedRutas = payload.role === 'AGENTE' ? (payload.assignedRutas || []) : [];
      await updateUser(id, payload);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await deleteUser(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="dashboard-section">
        <h2>Crear usuario</h2>
        <form onSubmit={handleCreate} className="user-form">
          <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <select className="input" value={form.paisOrigen} onChange={e => setForm({ ...form, paisOrigen: e.target.value })}>
              <option value="Ecuador">Ecuador (cédula)</option>
              <option value="Extranjero">Extranjero (pasaporte)</option>
            </select>
            {form.paisOrigen === 'Ecuador' ? (
              <input className="input" placeholder="Cédula" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} required />
            ) : (
              <input className="input" placeholder="Pasaporte" value={form.pasaporte} onChange={e => setForm({ ...form, pasaporte: e.target.value })} required />
            )}
            <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
            <input className="input" placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
            <input className="input" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} required />
            <input className="input" type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="AGENTE">AGENTE</option>
            </select>
            <button type="submit" className="btn btn-primary">Crear</button>
          </div>
        </form>
      </div>

      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2>Usuarios</h2>
          <input
            className="input"
            placeholder="Buscar por nombre/cédula…"
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value); }}
            style={{ maxWidth: '280px' }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><p>No hay usuarios.</p></div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Identificación</th><th>Nombre</th><th>Apellido</th><th>Teléfono</th><th>Provincia</th><th>Rol</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const id = u._id || u.id;
                  const editing = editingId === id;
                  return (
                    <tr key={id}>
                      <td>{u.cedula || u.pasaporte || '—'}</td>
                      <td>{editing ? <input className="input" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /> : u.nombre}</td>
                      <td>{editing ? <input className="input" value={editForm.apellido} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })} /> : u.apellido}</td>
                      <td>{editing ? <input className="input" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} /> : u.telefono}</td>
                      <td>{editing ? <input className="input" value={editForm.provincia} onChange={e => setEditForm({ ...editForm, provincia: e.target.value })} /> : (u.provincia || '—')}</td>
                      <td>
                        {editing
                          ? <select className="input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="AGENTE">AGENTE</option></select>
                          : (u.role || 'USER').toUpperCase()}
                        {editing && editForm.role === 'AGENTE' && (
                          <div style={{ marginTop: '8px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', minWidth: '200px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Rutas asignadas:</div>
                            {rutas.length === 0 ? (
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>No hay rutas.</div>
                            ) : rutas.map((r) => {
                              const rid = String(r._id || r.id);
                              return (
                                <label key={rid} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '2px 0', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={(editForm.assignedRutas || []).includes(rid)}
                                    onChange={() => toggleAssignedRuta(rid)}
                                  />
                                  {r.from} ➜ {r.to}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <div className="action-buttons">
                            <button className="btn btn-primary" onClick={() => saveEdit(id)}>Guardar</button>
                            <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancelar</button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn btn-secondary" onClick={() => startEdit(u)}>Editar</button>
                            <button className="btn btn-ghost" onClick={() => handleDelete(id)}>Eliminar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span>Página {pagination.page} de {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
