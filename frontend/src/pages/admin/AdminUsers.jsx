import React, { useEffect, useState, useCallback } from 'react';
import { listUsers, createUser, updateUser, cambiarEstadoUsuario } from '../../services/users';
import { getRutas } from '../../services/rutas';
import { AlertPopup, ConfirmPopup } from '../../components/Popup';
import useFeedback from '../../hooks/useFeedback';

const emptyCreate = { cedula: '', pasaporte: '', email: '', nombre: '', apellido: '', telefono: '', paisOrigen: 'Ecuador', password: '', role: 'USER' };

/**
 * Presentación de los estados de cuenta.
 *
 * Las cuentas no se borran: se bloquean o se dan de baja. Así las reservas,
 * boletos y calificaciones conservan su referencia al usuario y el histórico
 * sigue siendo consultable.
 */
const ESTADOS_UI = {
  ACTIVO: { etiqueta: 'Activo', color: 'var(--success)', icono: '●' },
  BLOQUEADO: { etiqueta: 'Bloqueado', color: 'var(--warning)', icono: '⊘' },
  ELIMINADO: { etiqueta: 'De baja', color: 'var(--error)', icono: '✕' }
};

/** Los usuarios creados antes de la baja lógica no tienen el campo `estado`. */
const estadoDe = (usuario) => String(usuario?.estado || 'ACTIVO').toUpperCase();

function EstadoBadge({ estado }) {
  const info = ESTADOS_UI[estado] || ESTADOS_UI.ACTIVO;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '999px',
        color: info.color,
        background: 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${info.color}`,
        whiteSpace: 'nowrap'
      }}
      title={info.etiqueta}
    >
      <span aria-hidden="true">{info.icono}</span>
      {info.etiqueta}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState(emptyCreate);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', nombre: '', apellido: '', telefono: '', provincia: '', role: 'USER', password: '', assignedRutas: [] });
  const [rutas, setRutas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');

  /**
   * Cambio de estado pendiente de confirmar.
   * Forma: { usuario, estado, motivo, enCurso, error }
   */
  const [cambioEstado, setCambioEstado] = useState(null);

  const { aviso, mostrarExito, mostrarError, cerrarAviso } = useFeedback();

  useEffect(() => {
    getRutas().then((r) => setRutas(Array.isArray(r) ? r : (r?.data || []))).catch(() => setRutas([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listUsers({
        page,
        limit: 10,
        search: search || undefined,
        estado: filtroEstado || undefined
      });
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
  }, [page, search, filtroEstado]);

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
      mostrarExito('El usuario se ha creado correctamente.', 'Usuario creado');
    } catch (e) {
      mostrarError(e, 'No se pudo crear el usuario');
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id || u.id);
    setEditForm({
      email: u.email || '', nombre: u.nombre || '', apellido: u.apellido || '', telefono: u.telefono || '',
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
      mostrarExito('Los cambios se han guardado.', 'Usuario actualizado');
    } catch (e) {
      mostrarError(e, 'No se pudo actualizar el usuario');
    }
  };

  /**
   * Abre la confirmación de cambio de estado.
   *
   * Sustituye al borrado de usuarios: ninguna de las tres operaciones elimina
   * datos. BLOQUEADO corta el acceso conservando todo; ELIMINADO marca la baja;
   * ACTIVO reactiva la cuenta.
   */
  const pedirCambioEstado = (usuario, estado) => {
    setCambioEstado({ usuario, estado, motivo: '', enCurso: false, error: null });
  };

  const confirmarCambioEstado = async () => {
    if (!cambioEstado) return;

    const { usuario, estado, motivo } = cambioEstado;
    const id = usuario._id || usuario.id;

    try {
      setCambioEstado((prev) => ({ ...prev, enCurso: true, error: null }));
      await cambiarEstadoUsuario(id, estado, motivo.trim() || undefined);

      setCambioEstado(null);
      load();

      const nombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'La cuenta';
      const textos = {
        BLOQUEADO: `${nombre} ya no puede iniciar sesión. Sus datos y su historial se conservan intactos.`,
        ELIMINADO: `${nombre} ha quedado dada de baja. Sus reservas y boletos siguen en el sistema.`,
        ACTIVO: `${nombre} vuelve a tener acceso con normalidad.`
      };

      mostrarExito(textos[estado], 'Estado actualizado');
    } catch (e) {
      setCambioEstado((prev) => ({ ...prev, enCurso: false, error: e.message }));
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
            <input className="input" type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="input"
              value={filtroEstado}
              onChange={e => { setPage(1); setFiltroEstado(e.target.value); }}
              aria-label="Filtrar por estado de cuenta"
              style={{ maxWidth: '190px' }}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Solo activos</option>
              <option value="BLOQUEADO">Solo bloqueados</option>
              <option value="ELIMINADO">Solo dados de baja</option>
            </select>
            <input
              className="input"
              placeholder="Buscar por nombre/cédula…"
              value={search}
              onChange={e => { setPage(1); setSearch(e.target.value); }}
              style={{ maxWidth: '280px' }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {feedback && (
          <div className={feedback.type === 'warning' ? 'error-message' : 'success-message'} role="status">
            {feedback.text}
          </div>
        )}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><p>No hay usuarios.</p></div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Identificación</th><th>Nombre</th><th>Apellido</th><th>Correo</th><th>Teléfono</th><th>Provincia</th><th>Rol</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const id = u._id || u.id;
                  const editing = editingId === id;
                  const estado = estadoDe(u);
                  return (
                    <tr key={id}>
                      <td>{u.cedula || u.pasaporte || '—'}</td>
                      <td>{editing ? <input className="input" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /> : u.nombre}</td>
                      <td>{editing ? <input className="input" value={editForm.apellido} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })} /> : u.apellido}</td>
                      <td>{editing ? <input className="input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /> : (u.email || '—')}</td>
                      <td>{editing ? <input className="input" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} /> : u.telefono}</td>
                      <td>{editing ? <input className="input" value={editForm.provincia} onChange={e => setEditForm({ ...editForm, provincia: e.target.value })} /> : (u.provincia || '—')}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '999px',
                          background: u.isDeleted ? '#fee2e2' : '#dcfce7',
                          color: u.isDeleted ? '#b91c1c' : '#166534',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {u.isDeleted ? 'Bloqueada' : 'Activa'}
                        </span>
                      </td>
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
                        <EstadoBadge estado={estado} />
                        {u.estadoMotivo && (
                          <div
                            style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '180px' }}
                            title={u.estadoMotivo}
                          >
                            {u.estadoMotivo}
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
                          /* Las acciones dependen del estado actual. Ya no hay
                             "Eliminar": el borrado físico dejaba huérfanas las
                             reservas y boletos del usuario. */
                          <div className="action-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" onClick={() => startEdit(u)}>Editar</button>

                            {estado === 'ACTIVO' && (
                              <>
                                <button
                                  className="btn btn-warning"
                                  onClick={() => pedirCambioEstado(u, 'BLOQUEADO')}
                                  title="Impide el acceso conservando todos los datos"
                                >
                                  Bloquear
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => pedirCambioEstado(u, 'ELIMINADO')}
                                  title="Marca la cuenta como dada de baja (no borra datos)"
                                >
                                  Dar de baja
                                </button>
                              </>
                            )}

                            {estado !== 'ACTIVO' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => pedirCambioEstado(u, 'ACTIVO')}
                                title="Devuelve el acceso a la cuenta"
                              >
                                Reactivar
                              </button>
                            )}

                            {estado === 'BLOQUEADO' && (
                              <button
                                className="btn btn-danger"
                                onClick={() => pedirCambioEstado(u, 'ELIMINADO')}
                                title="Marca la cuenta como dada de baja (no borra datos)"
                              >
                                Dar de baja
                              </button>
                            )}
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

      {/* Confirmación del cambio de estado. Pide el motivo porque es el texto
          que verá el usuario cuando intente iniciar sesión. */}
      <ConfirmPopup
        open={!!cambioEstado}
        onCancel={() => setCambioEstado(null)}
        onConfirm={confirmarCambioEstado}
        title={
          cambioEstado?.estado === 'BLOQUEADO'
            ? '¿Bloquear esta cuenta?'
            : cambioEstado?.estado === 'ELIMINADO'
              ? '¿Dar de baja esta cuenta?'
              : '¿Reactivar esta cuenta?'
        }
        message={
          cambioEstado
            ? `Usuario: ${cambioEstado.usuario.nombre || ''} ${cambioEstado.usuario.apellido || ''} (${cambioEstado.usuario.cedula || cambioEstado.usuario.pasaporte || 'sin identificación'}).`
            : ''
        }
        note={
          cambioEstado?.estado === 'ACTIVO'
            ? 'La cuenta recuperará el acceso inmediatamente y podrá volver a iniciar sesión.'
            : 'No se borra ningún dato. Sus reservas, boletos y calificaciones permanecen en la base de datos; solo se le retira el acceso. La operación es reversible desde este mismo panel.'
        }
        confirmLabel={
          cambioEstado?.estado === 'BLOQUEADO'
            ? 'Bloquear'
            : cambioEstado?.estado === 'ELIMINADO'
              ? 'Dar de baja'
              : 'Reactivar'
        }
        variant={cambioEstado?.estado === 'ACTIVO' ? 'info' : 'warning'}
        destructive={cambioEstado?.estado !== 'ACTIVO'}
        loading={!!cambioEstado?.enCurso}
        error={cambioEstado?.error}
      >
        {cambioEstado && cambioEstado.estado !== 'ACTIVO' && (
          <div className="field">
            <label htmlFor="motivo-estado">Motivo (se le mostrará al usuario)</label>
            <input
              id="motivo-estado"
              className="input"
              value={cambioEstado.motivo}
              onChange={e => setCambioEstado(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ej.: Incumplimiento de las condiciones de uso"
              maxLength={300}
              disabled={cambioEstado.enCurso}
            />
          </div>
        )}
      </ConfirmPopup>

      {/* Avisos de resultado. Antes eran `alert()` del navegador: bloqueaban el
          hilo y no seguían la identidad visual del proyecto. */}
      <AlertPopup
        open={!!aviso}
        variant={aviso?.variant}
        title={aviso?.title}
        message={aviso?.message}
        onClose={cerrarAviso}
      />
    </div>
  );
}
