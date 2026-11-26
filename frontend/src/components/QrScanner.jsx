import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * Escáner de QR basado en la cámara (html5-qrcode).
 * - Se importa la librería de forma diferida para no romper el build si no
 *   estuviera instalada y para aislar errores de cámara.
 * - La cámara requiere un contexto seguro (HTTPS) o localhost. En otros casos
 *   el componente muestra el motivo y el usuario puede usar el ingreso manual.
 *
 * Props:
 *   onScan(text)  – callback con el contenido decodificado del QR.
 *   active        – boolean: arranca/detiene la cámara.
 */
export default function QrScanner({ onScan, active }) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const instanceRef = useRef(null);
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);
  // Serializa start()/stop(): si `active` cambia dos veces seguidas antes de
  // que termine la operación anterior, html5-qrcode puede lanzar "Cannot
  // transition to a new state, already under transition" y la cámara se queda
  // sin arrancar. Encolar en vez de lanzar en paralelo es lo que evita eso.
  const transitionRef = useRef(Promise.resolve());
  const [error, setError] = useState(null);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);
      scannedRef.current = false;

      const secure = window.isSecureContext ||
        ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!secure) {
        setError('La cámara necesita HTTPS o localhost. Usa el ingreso manual del código en este dispositivo.');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Este navegador no permite acceso a la cámara. Usa el ingreso manual.');
        return;
      }

      try {
        const mod = await import('html5-qrcode');
        if (cancelled) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const instance = new Html5Qrcode(containerId.current, { verbose: false });
        instanceRef.current = instance;

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            // html5-qrcode sigue leyendo frames (cada ~100ms a 10fps) mientras
            // stop() no haya terminado, así que un mismo QR puede disparar este
            // callback varias veces antes de que el padre cierre la cámara.
            // Sin este guard, cada frame de más llamaba otra vez a onScan y
            // disparaba una verificación duplicada del mismo boleto.
            if (scannedRef.current || cancelled) return;
            scannedRef.current = true;
            if (onScanRef.current) onScanRef.current(decodedText);
          },
          () => { /* fallos de lectura por frame: se ignoran */ }
        );
      } catch (err) {
        if (!cancelled) {
          const msg = String(err?.message || err || '');
          // Mensaje más claro para el caso más común en campo: otra pestaña/app
          // ya tiene la cámara abierta (p.ej. recargar la página sin haber
          // soltado el stream anterior).
          const amigable = /NotReadableError|TrackStartError|already in use/i.test(msg)
            ? 'La cámara está siendo usada por otra pestaña o aplicación. Cierra las demás y vuelve a abrir la cámara.'
            : /NotAllowedError|Permission denied/i.test(msg)
              ? 'Permiso de cámara denegado. Habilítalo en los ajustes del navegador y vuelve a intentar.'
              : 'No se pudo iniciar la cámara: ' + msg + '. Usa el ingreso manual.';
          setError(amigable);
        }
      }
    }

    async function stop() {
      const instance = instanceRef.current;
      instanceRef.current = null;
      if (instance) {
        try { await instance.stop(); } catch (_) { /* ya detenida */ }
        try { await instance.clear(); } catch (_) { /* noop */ }
      }
    }

    // Encadena esta transición a la anterior en vez de lanzarla de inmediato:
    // evita que un start() y un stop() (o dos start() seguidos) corran a la vez
    // sobre la misma instancia de la cámara.
    transitionRef.current = transitionRef.current.then(() => (active ? start() : stop()));

    return () => {
      cancelled = true;
      transitionRef.current = transitionRef.current.then(() => stop());
    };
  }, [active]);

  return (
    <div>
      <div
        id={containerId.current}
        style={{
          width: '100%',
          maxWidth: '320px',
          margin: '0 auto',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#000',
          minHeight: active && !error ? '240px' : '0'
        }}
      />
      {error && (
        <div style={{ color: '#b45309', background: '#fef3c7', borderRadius: '8px', padding: '10px', marginTop: '10px', fontSize: '13px' }}>
          <Icon name="alert" size={16} /> {error}
        </div>
      )}
    </div>
  );
}
