import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, deleteCurrentUser, updateCurrentUser } from '../services/users';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Datos de ejemplo del usuario

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', telefono: '', password: '' });

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
    setError(null);
    setSuccess(null);
    
    try {
      // Preparar los datos para actualizar (solo enviar password si no está vacío)
      const updateData = {
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
        nombre: updatedUser.nombre || '',
        apellido: updatedUser.apellido || '',
        telefono: updatedUser.telefono || '',
        password: ''
      });
      
      setSuccess('Perfil actualizado exitosamente');
      setEditing(false);
    } catch (err) {
      setError('Error al actualizar perfil: ' + err.message);
      console.error('Error al actualizar perfil:', err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    
    if (!confirmDelete) return;
    
    try {
      setError(null);
      await deleteCurrentUser();
      // Si se elimina exitosamente, limpiar token y redirigir
      localStorage.removeItem('token');
      alert('Tu cuenta ha sido eliminada exitosamente');
      navigate('/demo');
    } catch (err) {
      setError('Error al eliminar cuenta: ' + err.message);
      console.error('Error al eliminar cuenta:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      telefono: user.telefono || '',
      password: ''
    });
    setError(null);
    setSuccess(null);
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

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

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
          <h3>Zona de Peligro</h3>
          <p>Una vez que elimines tu cuenta, no hay vuelta atrás.</p>
          <button 
            className="btn-delete" 
            onClick={handleDeleteAccount}
          >
            Eliminar Cuenta
          </button>
        </div>
      </div>
    </div>
  );
}