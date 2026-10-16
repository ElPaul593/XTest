import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Recuperación de cuenta por código de 6 dígitos.
 *
 * Qué se arregló respecto a la versión anterior, que se veía descolocada:
 *
 *  · Los `<input>` y el `<select>` no llevaban `className="input"`, así que se
 *    quedaban con el estilo por defecto del navegador —fondo claro, esquinas
 *    vivas— en medio de una interfaz de cristal oscuro. Era lo que más chocaba.
 *  · Había una etiqueta «Cédula» encima de un selector que también decía
 *    «Cédula», y el campo real quedaba debajo del selector: tres elementos
 *    seguidos diciendo lo mismo y ninguno claramente asociado al otro.
 *  · El enlace de volver salía en morado, el azul por defecto de los enlaces.
 *  · No se veía en qué paso de los tres estaba el usuario.
 */
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
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const esPassword = purpose === 'password';
  const titulo = esPassword ? 'Recuperar contraseña' : 'Recuperar cuenta';

  const submitRequest = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      setEnviando(true);
      const payload = { email: email.trim(), purpose, [tipo]: identifier.trim() };
      const response = await api.post('/auth/recovery/request', payload);
      setRecoveryId(response.data.recoveryId || '');
      setMessage(response.data.message);
      if (response.data.recoveryId) setStep(2);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const submitConfirmation = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      setEnviando(true);
      await api.post('/auth/recovery/confirm', { recoveryId, code, password });
      setMessage('Cuenta recuperada exitosamente. Ya puedes iniciar sesión.');
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.error || 'Código inválido o expirado.');
    } finally {
      setEnviando(false);
    }
  };

  /** Indicador de los tres pasos del flujo. */
  const Pasos = () => (
    <ol className="recovery-steps" aria-label={`Paso ${step} de 3`}>
      {[
        { n: 1, texto: 'Identifícate' },
        { n: 2, texto: 'Código' },
        { n: 3, texto: 'Listo' }
      ].map(({ n, texto }) => (
        <li
          key={n}
          className={`recovery-step ${step === n ? 'is-active' : ''} ${step > n ? 'is-done' : ''}`}
        >
          <span className="recovery-step-num" aria-hidden="true">{step > n ? '✓' : n}</span>
          <span className="recovery-step-text">{texto}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <main className="center-screen">
      <div className="card" role="dialog" aria-labelledby="recovery-title">
        <h2 id="recovery-title">{titulo}</h2>
        <p className="recovery-lead">
          {esPassword
            ? 'Te enviaremos un código de 6 dígitos para crear una contraseña nueva.'
            : 'Si tu cuenta fue bloqueada o dada de baja, recupera el acceso con un código de 6 dígitos.'}
        </p>

        <Pasos />

        {step === 1 && (
          <form className="form-grid" onSubmit={submitRequest} noValidate>
            {/* El selector decide QUÉ documento se pide; su etiqueta lo dice así,
                en vez de repetir el nombre del documento tres veces seguidas. */}
            <div className="field">
              <label htmlFor="recovery-tipo">Tipo de documento</label>
              <select
                id="recovery-tipo"
                className="input"
                value={tipo}
                onChange={(e) => { setTipo(e.target.value); setIdentifier(''); }}
                disabled={enviando}
              >
                <option value="cedula">Cédula</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="recovery-id">
                {tipo === 'cedula' ? 'Número de cédula' : 'Número de pasaporte'}
              </label>
              <input
                id="recovery-id"
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(
                  tipo === 'cedula'
                    ? e.target.value.replace(/\D/g, '').slice(0, 10)
                    : e.target.value.slice(0, 20)
                )}
                inputMode={tipo === 'cedula' ? 'numeric' : 'text'}
                placeholder={tipo === 'cedula' ? '1723456789' : 'AB123456'}
                disabled={enviando}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="recovery-email">Correo registrado</label>
              <input
                id="recovery-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                disabled={enviando}
                required
              />
              <small className="field-hint">
                Tiene que ser el mismo correo con el que te registraste: ahí
                enviaremos el código.
              </small>
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="form-grid" onSubmit={submitConfirmation} noValidate>
            {message && <div className="success-message">{message}</div>}

            <div className="field">
              <label htmlFor="recovery-code">Código de recuperación</label>
              <input
                id="recovery-code"
                className="input input-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={enviando}
                required
              />
              <small className="field-hint">Son 6 dígitos y caduca pronto.</small>
            </div>

            <div className="field">
              <label htmlFor="recovery-password">Nueva contraseña</label>
              <input
                id="recovery-password"
                className="input"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={enviando}
                required
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={enviando || code.length !== 6 || password.length < 6}
            >
              {enviando ? 'Confirmando…' : 'Confirmar recuperación'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => { setStep(1); setCode(''); setPassword(''); setError(null); }}
              disabled={enviando}
            >
              Volver atrás
            </button>
          </form>
        )}

        {step === 3 && (
          <>
            <div className="success-message">{message}</div>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </button>
          </>
        )}

        {/* En el paso 2 el mensaje ya se muestra dentro del formulario. */}
        {message && step === 1 && <div className="success-message">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="recovery-footer">
          <Link to="/login" className="forgot-link">Volver al inicio de sesión</Link>
        </div>
      </div>
    </main>
  );
}
