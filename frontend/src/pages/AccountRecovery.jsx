import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AccountRecovery({ purpose = 'account' }) {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState('cedula');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submitRequest = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = { email: email.trim(), purpose, [tipo]: identifier.trim() };
      const response = await api.post('/auth/recovery/request', payload);
      setRecoveryId(response.data.recoveryId || '');
      setMessage(response.data.message);
      if (response.data.recoveryId) setStep(2);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo procesar la solicitud.');
    }
  };

  const submitConfirmation = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await api.post('/auth/recovery/confirm', { recoveryId, code, password });
      setMessage('Cuenta recuperada exitosamente. Ya puedes iniciar sesión.');
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.error || 'Código inválido o expirado.');
    }
  };

  return (
    <main className="center-screen">
      <div className="card" role="dialog" aria-labelledby="recovery-title">
        <h2 id="recovery-title">{purpose === 'password' ? 'Recuperar contraseña' : 'Recuperar cuenta'}</h2>
        {step === 1 && (
          <form className="form-grid" onSubmit={submitRequest}>
            <label htmlFor="recovery-id">{tipo === 'cedula' ? 'Cédula' : 'Pasaporte'}</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="cedula">Cédula</option>
              <option value="pasaporte">Pasaporte</option>
            </select>
            <input id="recovery-id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            <label htmlFor="recovery-email">Correo registrado</label>
            <input id="recovery-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn btn-primary" type="submit">Enviar código</button>
          </form>
        )}
        {step === 2 && (
          <form className="form-grid" onSubmit={submitConfirmation}>
            <p>{message}</p>
            <label htmlFor="recovery-code">Código de recuperación</label>
            <input id="recovery-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            <label htmlFor="recovery-password">Nueva contraseña</label>
            <input id="recovery-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn btn-primary" type="submit">Confirmar recuperación</button>
          </form>
        )}
        {step === 3 && <button className="btn btn-primary" onClick={() => navigate('/login')}>Ir a iniciar sesión</button>}
        {message && step !== 2 && <p>{message}</p>}
        {error && <div className="error">{error}</div>}
        <Link to="/login">Volver al inicio de sesión</Link>
      </div>
    </main>
  );
}
