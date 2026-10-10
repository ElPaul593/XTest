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

  // Se guarda en una ref para que el callback que registra GIS use siempre la
  // versión más reciente sin tener que volver a inicializar el botón.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => { onCredentialRef.current = onCredential; }, [onCredential]);

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
              onError?.('Google no devolvió ninguna credencial.');
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
        onError?.('No se pudo cargar el acceso con Google.');
      }
    })();

    return () => { cancelado = true; };
  }, [texto, onError]);

  if (estado === 'deshabilitado') return null;

  return (
    <div className="google-signin">
      {estado === 'cargando' && (
        <div className="google-signin-placeholder">Cargando acceso con Google…</div>
      )}
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
