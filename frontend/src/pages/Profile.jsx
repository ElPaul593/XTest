import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, deleteCurrentUser, updateCurrentUser } from '../services/users';
import { logout } from '../services/auth';
import { AlertPopup, ConfirmPopup } from '../components/Popup';
import useFeedback from '../hooks/useFeedback';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Ventana emergente de confirmación de baja de cuenta.
  const [bajaOpen, setBajaOpen] = useState(false);
  const [bajaEnCurso, setBajaEnCurso] = useState(false);
  const [bajaError, setBajaError] = useState(null);

  const { aviso, mostrarExito, mostrarError, cerrarAviso } = useFeedback();
  
  // Datos de ejemplo del usuario

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', nombre: '', apellido: '', telefono: '', password: '' });

  useEffect(() => {
    // Validar autenticación
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Simular carga de datos
    // Obtener datos reales del usuario autenticado
    (async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
        setFormData({
          email: me.email || '',
          nombre: me.nombre || '',
          apellido: me.apellido || '',
          telefono: me.telefono || '',
          password: ''
        });
      } catch (err) {
        // Si hay error (token inválido, expirado, etc.), redirigir al login
        console.error('Error al obtener usuario actual:', err.message);
        localStorage.removeItem('token');
        navigate('/login');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    cerrarAviso();

    try {
      // Preparar los datos para actualizar (solo enviar password si no está vacío)
      const updateData = {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      };
      
      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }
      
      // Llamar a la API para actualizar el perfil
      const updatedUser = await updateCurrentUser(updateData);
      
      // Actualizar el estado local con los datos actualizados
      setUser(updatedUser);
      setFormData({
        email: updatedUser.email || '',
        nombre: updatedUser.nombre || '',
        apellido: updatedUser.apellido || '',
        telefono: updatedUser.telefono || '',
        password: ''
      });
      
      mostrarExito('Tus datos se han guardado correctamente.', 'Perfil actualizado');
      setEditing(false);
    } catch (err) {
      mostrarError(err, 'No se pudo actualizar el perfil');
      console.error('Error al actualizar perfil:', err);
    }
  };

  /**
   * Baja de la cuenta.
   *
   * La confirmación se hace con una ventana emergente propia en lugar de
   * `window.confirm()`: el diálogo del navegador no admite dar formato al texto,
   * y aquí hace falta explicar algo que no es obvio: la baja NO borra el
   * historial. El texto anterior ("Esta acción no se puede deshacer") describía
   * un borrado físico que ya no es lo que ocurre.
   */
  const handleDeleteAccount = async () => {
    try {
      setBajaEnCurso(true);
      setBajaError(null);

      await deleteCurrentUser();

      // La cuenta queda en estado ELIMINADO: el token sigue siendo válido
      // criptográficamente, pero el backend lo rechazará en la siguiente
      // petición. Se cierra la sesión localmente para no dejarla a medias.
      logout();
      setBajaOpen(false);
      setBajaEnCurso(false);

      mostrarExito(
        'Tu cuenta ha sido dada de baja y ya no podrás iniciar sesión con ella. Tu historial de reservas se conserva: si necesitas recuperar el acceso, contacta con el administrador.',
        'Cuenta dada de baja'
      );
    } catch (err) {
      setBajaEnCurso(false);
      setBajaError(err.message);
      console.error('Error al dar de baja la cuenta:', err);
    }
  };

  /** Al cerrar el aviso posterior a la baja, se sale de la aplicación. */
  const handleCerrarAviso = () => {
    const eraBaja = aviso?.title === 'Cuenta dada de baja';
    cerrarAviso();
    if (eraBaja) navigate('/demo');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData({
      email: user.email || '',
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      telefono: user.telefono || '',
      password: ''
    });
    cerrarAviso();
  };

  if (!token) {
    return null; // No mostrar nada mientras redirige
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          <div className="profile-actions">
            {!editing ? (
              <button 
                className="btn-edit" 
                onClick={() => setEditing(true)}
              >
                Editar Perfil
              </button>
            ) : (
              <button 
                className="btn-cancel" 
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Los avisos ya no se insertan aquí (quedaban pegados bajo el header y
            desplazaban el contenido): ahora se muestran como ventana emergente
            centrada, al final de este componente. */}

        {!editing ? (
          <div className="profile-info">
            {user.cedula ? (
              <div className="info-group">
                <label>Cédula:</label>
                <span>{user.cedula}</span>
              </div>
            ) : (
              <div className="info-group">
                <label>Pasaporte:</label>
                <span>{user.pasaporte || 'No especificado'}</span>
              </div>
            )}
            <div className="info-group">
              <label>Correo electrónico:</label>
              <span>{user.email || 'No especificado'}</span>
            </div>
            <div className="info-group">
              <label>Nombre:</label>
              <span>{user.nombre}</span>
            </div>
            <div className="info-group">
              <label>Apellido:</label>
              <span>{user.apellido}</span>
            </div>
            <div className="info-group">
              <label>Teléfono:</label>
              <span>{user.telefono}</span>
            </div>
            <div className="info-group">
              <label>País de origen:</label>
              <span>{user.paisOrigen || 'No especificado'}</span>
            </div>
            <div className="info-group">
              <label>Fecha de registro:</label>
              <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            {user.cedula ? (
              <div className="form-group">
                <label>Cédula:</label>
                <input 
                  type="text" 
                  value={user.cedula} 
                  disabled 
                  className="input-disabled"
                />
                <small>La cédula no se puede modificar</small>
              </div>
            ) : (
              <div className="form-group">
                <label>Pasaporte:</label>
                <input 
                  type="text" 
                  value={user.pasaporte || ''} 
                  disabled 
                  className="input-disabled"
                />
                <small>El pasaporte no se puede modificar</small>
              </div>
            )}
            
            <div className="form-group">
              <label>País de origen:</label>
              <input 
                type="text" 
                value={user.paisOrigen || ''} 
                disabled 
                className="input-disabled"
              />
              <small>El país de origen no se puede modificar</small>
            </div>
            
            <div className="form-group">
              <label>Correo electrónico:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Apellido:</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Teléfono:</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Nueva Contraseña:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                Guardar Cambios
              </button>
            </div>
          </form>
        )}

        <div className="danger-zone">
          <h3>Baja de la cuenta</h3>
          <p>
            Tu cuenta dejará de poder iniciar sesión. Tu historial de reservas y
            boletos se conserva, así que la baja es reversible: solo un
            administrador puede reactivarla.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => { setBajaError(null); setBajaOpen(true); }}
          >
            Dar de baja mi cuenta
          </button>
        </div>
      </div>

      {/* Confirmación de baja */}
      <ConfirmPopup
        open={bajaOpen}
        onCancel={() => setBajaOpen(false)}
        onConfirm={handleDeleteAccount}
        title="¿Dar de baja tu cuenta?"
        message="Perderás el acceso de inmediato y no podrás volver a iniciar sesión con esta cédula o pasaporte."
        note="Tus reservas, boletos y calificaciones NO se borran: se conservan asociados a tu cuenta para mantener el histórico. Si más adelante quieres volver, un administrador puede reactivarla."
        confirmLabel="Sí, dar de baja"
        cancelLabel="Conservar mi cuenta"
        destructive
        loading={bajaEnCurso}
        error={bajaError}
      />

      {/* Avisos de resultado */}
      <AlertPopup
        open={!!aviso}
        variant={aviso?.variant}
        title={aviso?.title}
        message={aviso?.message}
        onClose={handleCerrarAviso}
      />
    </div>
  );
}