import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, requestPasswordReset, loginConGoogle, reenviarVerificacion } from '../services/auth';
import { setSession, homePathForRole } from '../services/session';
import Popup, { AlertPopup } from './Popup';
import GoogleSignInButton from './GoogleSignInButton';
import useFeedback from '../hooks/useFeedback';

export default function LoginForm() {
  const [tipoIdentificacion, setTipoIdentificacion] = useState('cedula'); // 'cedula' o 'pasaporte'
  const [cedula, setCedula] = useState('');
  const [pasaporte, setPasaporte] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ identificacion: false, password: false });
  const navigate = useNavigate();

  // Recuperación de contraseña (ventana emergente).
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEnviando, setResetEnviando] = useState(false);
  const [resetError, setResetError] = useState(null);

  // Aviso de correo sin confirmar: { email, destino }
  const [verificacionPendiente, setVerificacionPendiente] = useState(null);
  const [reenviando, setReenviando] = useState(false);

  const { aviso, mostrarExito, mostrarError, cerrarAviso } = useFeedback();

  /**
   * Si la sesión se cerró porque la cuenta quedó bloqueada o dada de baja, el
   * interceptor de `services/api.js` dejó el motivo aquí antes de redirigir.
   * Se muestra una sola vez: sin esto el usuario volvería al login sin saber por qué.
   */
  useEffect(() => {
    let mensaje = null;
    try {
      mensaje = sessionStorage.getItem('authEstadoMensaje');
      if (mensaje) sessionStorage.removeItem('authEstadoMensaje');
    } catch {
      // Almacenamiento no disponible (modo privado): no hay mensaje que mostrar.
    }

    if (mensaje) {
      mostrarError(mensaje, 'Sesión cerrada');
    }
  }, [mostrarError]);

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

      /**
       * Correo sin confirmar.
       *
       * El backend deja entrar igualmente mientras `REQUIRE_EMAIL_VERIFIED` esté
       * en false, así que aquí no se bloquea: se avisa y se ofrece reenviar el
       * enlace. Importa porque de ese correo dependen el boleto electrónico y la
       * recuperación de contraseña.
       */
      if (data.emailVerificado === false) {
        setVerificacionPendiente({ email: data.email, destino: homePathForRole(data.role) });
        return;
      }

      navigate(homePathForRole(data.role));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Error en el login');
    }
  };

  /** Pide otro enlace de verificación y continúa a la aplicación. */
  const handleReenviarVerificacion = async () => {
    try {
      setReenviando(true);
      await reenviarVerificacion(verificacionPendiente.email);
      const destino = verificacionPendiente.destino;
      setVerificacionPendiente(null);
      mostrarExito('Te hemos enviado un enlace nuevo. Revisa tu bandeja de entrada y la carpeta de spam.', 'Correo reenviado');
      navigate(destino);
    } catch (err) {
      mostrarError(err.message, 'No se pudo reenviar');
    } finally {
      setReenviando(false);
    }
  };

  /**
   * Acceso con Google.
   *
   * Si no existe cuenta con ese correo, el backend NO crea nada: devuelve el
   * perfil verificado y se redirige al registro con los datos ya rellenados.
   * El modelo exige cédula o pasaporte, y Google no los proporciona, así que
   * crear la cuenta a medias habría metido datos inválidos en la base.
   */
  const handleGoogleCredential = async (credential) => {
    setError(null);

    try {
      const data = await loginConGoogle(credential);

      if (data.requiereRegistro) {
        navigate('/register', {
          state: {
            prefill: data.perfil,
            origen: 'google',
            aviso: 'Tu cuenta de Google se verificó correctamente. Completa los datos que Google no puede darnos para terminar el registro.'
          }
        });
        return;
      }

      setSession({ token: data.token, role: data.role });
      navigate(homePathForRole(data.role));
    } catch (err) {
      mostrarError(err.message, 'No se pudo entrar con Google');
    }
  };

  const abrirReset = () => {
    setResetError(null);
    setResetOpen(true);
  };

  const cerrarReset = () => {
    if (resetEnviando) return;
    setResetOpen(false);
    setResetError(null);
  };

  /**
   * Pide el enlace de recuperación. El backend construye el enlace dinámico
   * `{VERCEL_BACKEND_URL}/api/auth/reset-password/{token}` y delega el envío del
   * correo en la API consumidora.
   */
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError(null);

    const email = resetEmail.trim();
    if (!email) {
      setResetError('Introduce el correo con el que te registraste.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResetError('Ese correo no tiene un formato válido.');
      return;
    }

    try {
      setResetEnviando(true);
      const resultado = await requestPasswordReset(email);

      setResetOpen(false);
      setResetEmail('');
      mostrarExito(
        resultado?.message ||
          'Si el correo corresponde a una cuenta registrada, recibirás un enlace para restablecer tu contraseña.',
        'Revisa tu correo'
      );
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetEnviando(false);
    }
  };

  return (
    <main className="center-screen">
      <div className="card" role="dialog" aria-labelledby="login-title">
        <h2 id="login-title">Iniciar sesión</h2>

        {/* Selector de tipo de identificación.
            Usa las clases de botón de Bootstrap del proyecto (.btn/.btn-primary/
            .btn-secondary) en lugar de estilos en línea: así hereda la paleta
            negro + amarillo y el cristal, en vez del azul #007bff que traía
            codificado y que no pertenecía a la identidad visual. */}
        <div className="flex gap-sm" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn ${tipoIdentificacion === 'cedula' ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={tipoIdentificacion === 'cedula'}
            onClick={() => handleTipoChange('cedula')}
          >
            Cédula
          </button>
          <button
            type="button"
            className={`btn ${tipoIdentificacion === 'pasaporte' ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={tipoIdentificacion === 'pasaporte'}
            onClick={() => handleTipoChange('pasaporte')}
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
            {/* Dos caminos distintos, a propósito:
                · «¿Olvidaste tu contraseña?» abre la ventana emergente y envía un
                  ENLACE al correo (flujo de esta rama).
                · «Recuperar mi cuenta» lleva a la pantalla de código de 6 dígitos
                  que vino de la rama remota, pensada para cuando la cuenta está
                  bloqueada o dada de baja y no basta con cambiar la contraseña. */}
            <div className="forgot-password" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="forgot-link"
                onClick={abrirReset}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                className="forgot-link"
                onClick={() => navigate('/recuperar-cuenta')}
              >
                Recuperar mi cuenta
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={!isFormValid}>
            Entrar
          </button>

          {error && <div className="error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}
        </form>

        {/* Acceso con Google. El componente no renderiza nada si el servidor no
            tiene GOOGLE_CLIENT_ID configurado, así que el formulario de cédula
            sigue funcionando igual sin él. */}
        <div className="auth-divider"><span>o</span></div>

        <GoogleSignInButton
          onCredential={handleGoogleCredential}
          onError={(msg) => mostrarError(msg, 'Acceso con Google')}
          texto="signin_with"
        />
      </div>

      {/* Ventana emergente de recuperación de contraseña */}
      <Popup
        open={resetOpen}
        onClose={cerrarReset}
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace para crear una contraseña nueva."
        variant="info"
        icon="✉"
        closeOnBackdrop={!resetEnviando}
        showClose={!resetEnviando}
      >
        <form onSubmit={handleResetSubmit} noValidate>
          <div className="field">
            <label htmlFor="reset-email">Correo electrónico de tu cuenta</label>
            <input
              id="reset-email"
              className="input"
              type="email"
              autoComplete="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              disabled={resetEnviando}
              required
            />
          </div>

          <div className="popup-note">
            El enlace caduca a los 30 minutos y solo puede usarse una vez. Si no
            encuentras el correo, revisa la carpeta de spam.
          </div>

          {resetError && <div className="popup-error">{resetError}</div>}

          <div className="popup-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cerrarReset}
              disabled={resetEnviando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={resetEnviando}>
              {resetEnviando ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </div>
        </form>
      </Popup>

      {/* Correo pendiente de confirmar. No bloquea el acceso: informa y ofrece
          reenviar el enlace, porque de ese correo dependen el boleto electrónico
          y la recuperación de contraseña. */}
      <Popup
        open={!!verificacionPendiente}
        onClose={() => {
          const destino = verificacionPendiente?.destino;
          setVerificacionPendiente(null);
          if (destino) navigate(destino);
        }}
        title="Confirma tu correo electrónico"
        subtitle={verificacionPendiente?.email || undefined}
        variant="warning"
        icon="✉"
      >
        <p>
          Todavía no has confirmado tu dirección. Te enviamos un enlace al registrarte:
          búscalo en tu bandeja de entrada y revisa también la carpeta de spam.
        </p>

        <div className="popup-note popup-note--warning">
          Mientras no la confirmes no podremos enviarte tus boletos electrónicos ni
          ayudarte a recuperar la contraseña si la olvidas.
        </div>

        <div className="popup-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={reenviando}
            onClick={() => {
              const destino = verificacionPendiente?.destino;
              setVerificacionPendiente(null);
              if (destino) navigate(destino);
            }}
          >
            Lo haré luego
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleReenviarVerificacion}
            disabled={reenviando}
          >
            {reenviando ? 'Enviando…' : 'Reenviar enlace'}
          </button>
        </div>
      </Popup>

      {/* Avisos de resultado (éxito del envío, sesión cerrada por bloqueo…) */}
      <AlertPopup
        open={!!aviso}
        variant={aviso?.variant}
        title={aviso?.title}
        message={aviso?.message}
        onClose={cerrarAviso}
      />
    </main>
  );
}
