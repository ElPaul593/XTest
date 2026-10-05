import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { setSession, homePathForRole } from '../services/session';

export default function LoginForm() {
  const [tipoIdentificacion, setTipoIdentificacion] = useState('cedula'); // 'cedula' o 'pasaporte'
  const [cedula, setCedula] = useState('');
  const [pasaporte, setPasaporte] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ identificacion: false, password: false });
  const navigate = useNavigate();

  const cedulaDigits = cedula.replace(/\D/g, '');

  const identificacionError = useMemo(() => {
    if (!touched.identificacion) return null;
    
    if (tipoIdentificacion === 'cedula') {
      if (cedula.length === 0) return 'La cédula es requerida';
      if (!/^\d+$/.test(cedula)) return 'La cédula debe contener solo dígitos';
      if (cedula.length > 10) return 'Máximo 10 dígitos';
      if (cedula.length < 6) return 'La cédula es muy corta';
    } else {
      if (pasaporte.length === 0) return 'El pasaporte es requerido';
      if (pasaporte.length < 6) return 'El pasaporte debe tener al menos 6 caracteres';
      if (pasaporte.length > 20) return 'El pasaporte no puede tener más de 20 caracteres';
    }
    
    return null;
  }, [cedula, pasaporte, tipoIdentificacion, touched.identificacion]);

  const passwordError = useMemo(() => {
    if (!touched.password) return null;
    if (password.length === 0) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  }, [password, touched.password]);

  const isFormValid = !identificacionError && !passwordError && 
    (tipoIdentificacion === 'cedula' ? cedula : pasaporte) && password;

  const handleCedulaChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setCedula(digitsOnly.slice(0, 10));
  };

  const handleTipoChange = (tipo) => {
    setTipoIdentificacion(tipo);
    setCedula('');
    setPasaporte('');
    setError(null);
    setTouched({ identificacion: false, password: touched.password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identificacion: true, password: true });
    setError(null);
    if (!isFormValid) return;
    
    try {
      const loginData = tipoIdentificacion === 'cedula' 
        ? { cedula: cedulaDigits, password }
        : { pasaporte: pasaporte.trim(), password };
      
      const data = await login(loginData);
      setSession({ token: data.token, role: data.role });
      navigate(homePathForRole(data.role));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Error en el login');
    }
  };

  return (
    <main className="center-screen">
      <div className="card" role="dialog" aria-labelledby="login-title">
        <h2 id="login-title">Iniciar sesión</h2>
        
        {/* Selector de tipo de identificación */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => handleTipoChange('cedula')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              background: tipoIdentificacion === 'cedula' ? '#007bff' : '#fff',
              color: tipoIdentificacion === 'cedula' ? '#fff' : '#333',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          >
            Cédula
          </button>
          <button
            type="button"
            onClick={() => handleTipoChange('pasaporte')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              background: tipoIdentificacion === 'pasaporte' ? '#007bff' : '#fff',
              color: tipoIdentificacion === 'pasaporte' ? '#fff' : '#333',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          >
            Pasaporte
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="identificacion">
              {tipoIdentificacion === 'cedula' ? 'Cédula' : 'Pasaporte'}
            </label>
            {tipoIdentificacion === 'cedula' ? (
              <input
                id="identificacion"
                className="input"
                inputMode="numeric"
                pattern="\\d*"
                value={cedula}
                onChange={handleCedulaChange}
                onBlur={() => setTouched((t) => ({ ...t, identificacion: true }))}
                maxLength={10}
                placeholder="1723456789"
                required
              />
            ) : (
              <input
                id="identificacion"
                className="input"
                value={pasaporte}
                onChange={(e) => setPasaporte(e.target.value.slice(0, 20))}
                onBlur={() => setTouched((t) => ({ ...t, identificacion: true }))}
                placeholder="AB123456"
                required
              />
            )}
            {identificacionError && <div className="error">{identificacionError}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••"
              required
            />
            {passwordError && <div className="error">{passwordError}</div>}
            <div className="forgot-password">
              <button 
                type="button" 
                className="forgot-link"
                onClick={() => alert('Función de recuperar contraseña - Aquí se implementaría el flujo de recuperación')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={!isFormValid}>
            Entrar
          </button>

          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </main>
  );
}
