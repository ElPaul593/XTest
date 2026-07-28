import React, { useEffect, useRef, useState } from 'react';

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
  const [error, setError] = useState(null);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);

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
            if (onScanRef.current) onScanRef.current(decodedText);
          },
          () => { /* fallos de lectura por frame: se ignoran */ }
        );
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo iniciar la cámara: ' + (err?.message || err) + '. Usa el ingreso manual.');
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

    if (active) start();
    else stop();

    return () => { cancelled = true; stop(); };
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
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
