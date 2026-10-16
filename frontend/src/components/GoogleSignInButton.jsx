import React, { useEffect, useRef, useState } from 'react';
import { getGoogleConfig } from '../services/auth';

/**
 * Botón oficial de «Iniciar sesión con Google».
 *
 * Usa Google Identity Services (GIS), la biblioteca vigente. El script se carga
 * bajo demanda, no en `index.html`, por dos razones: así no penaliza a las
 * pantallas que no lo necesitan, y si el acceso con Google no está configurado en
 * el servidor no se carga nada en absoluto.
 *
 * El `clientId` se pide al backend (`/auth/google/config`) en lugar de duplicarlo
 * en un `.env` del frontend. El client id de OAuth es público por diseño —viaja
 * en el HTML de cualquier web que use Google Sign-In—, así que exponerlo no es un
 * problema; tenerlo en dos sitios que se desincronizan, sí.
 *
 * @param {Function} onCredential  Recibe el id_token para enviarlo al backend.
 * @param {Function} onError       Mensaje de error legible.
 * @param {string}   [texto]       'signin_with' | 'signup_with' | 'continue_with'
 */
export default function GoogleSignInButton({ onCredential, onError, texto = 'signin_with' }) {
  const contenedorRef = useRef(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | deshabilitado | error

  /**
   * Ambos callbacks van en refs, y NINGUNO en las dependencias del efecto.
   *
   * `LoginForm` pasa `onError` como función en línea (`onError={(m) => ...}`),
   * así que su identidad cambia en cada render. Tenerlo en el array de
   * dependencias hacía que el efecto se volviera a ejecutar continuamente: cada
   * pasada marcaba la anterior como cancelada, y como `setEstado('listo')` solo
   * corre si no está cancelada, el componente podía quedarse dando vueltas sin
   * llegar a mostrar el botón.
   */
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  useEffect(() => { onCredentialRef.current = onCredential; }, [onCredential]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let cancelado = false;

    /** Carga el script de GIS una sola vez, aunque haya varios botones. */
    const cargarScript = () => new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve();

      const existente = document.getElementById('google-identity-services');
      if (existente) {
        existente.addEventListener('load', () => resolve());
        existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el script de Google'));
      document.head.appendChild(script);
    });

    (async () => {
      try {
        const config = await getGoogleConfig();

        if (cancelado) return;

        if (!config?.habilitado || !config?.clientId) {
          // Sin configurar: el botón simplemente no aparece. No es un error que
          // deba ver el usuario final.
          setEstado('deshabilitado');
          return;
        }

        await cargarScript();
        if (cancelado || !contenedorRef.current) return;

        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: (respuesta) => {
            if (respuesta?.credential) {
              onCredentialRef.current?.(respuesta.credential);
            } else {
              onErrorRef.current?.('Google no devolvió ninguna credencial.');
            }
          }
        });

        window.google.accounts.id.renderButton(contenedorRef.current, {
          theme: 'filled_black',   // encaja con la paleta negra del proyecto
          size: 'large',
          shape: 'rectangular',
          text: texto,
          width: 320,
          locale: 'es'
        });

        setEstado('listo');
      } catch (err) {
        if (cancelado) return;
        console.error('[GoogleSignInButton]', err);
        setEstado('error');
        onErrorRef.current?.('No se pudo cargar el acceso con Google.');
      }
    })();

    return () => { cancelado = true; };
  }, [texto]);

  if (estado === 'deshabilitado') return null;

  return (
    <div className="google-signin">
      {/* El separador vive AQUÍ, no en el formulario que usa el componente.
          Estaba fuera y se quedaba colgado: cuando Google no está configurado el
          componente devuelve null, pero el «o» seguía pintándose con un hueco
          vacío debajo. Al estar dentro, separador y botón aparecen y desaparecen
          juntos. */}
      {/* Mientras se consulta si Google está configurado no se pinta NADA
          visible: si después resulta que no lo está, el separador y el texto de
          «Cargando…» desaparecían y el formulario daba un salto. El contenedor
          del botón sí tiene que existir desde el principio, porque Google
          inyecta su botón dentro. */}
      {estado !== 'cargando' && <div className="auth-divider"><span>o</span></div>}
      {estado === 'error' && (
        <div className="error">
          No se pudo cargar el acceso con Google. Puedes entrar con tu cédula o pasaporte.
        </div>
      )}
      {/* GIS inyecta su botón aquí. Debe existir siempre que no esté deshabilitado. */}
      <div ref={contenedorRef} style={{ display: estado === 'listo' ? 'flex' : 'none', justifyContent: 'center' }} />
    </div>
  );
}
