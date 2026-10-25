import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Ventanas emergentes (pop-up) de la aplicación.
 *
 * Sustituyen a los dos mecanismos que había antes:
 *
 *   · Los avisos en línea (`<div className="error-message">`) que se insertaban
 *     dentro del flujo del documento. Al vivir dentro de la tarjeta de la página,
 *     aparecían pegados al header y desplazaban el contenido al mostrarse.
 *
 *   · `window.alert()` y `window.confirm()`, que el navegador pinta con su propio
 *     estilo (ajeno a la identidad del proyecto), bloquean el hilo principal y no
 *     admiten contenido enriquecido.
 *
 * Detalle que hace que funcionen: se renderizan con `createPortal` directamente
 * en `document.body`, no dentro del árbol de la página. Un elemento con
 * `backdrop-filter`, `transform` o `filter` crea un contexto de apilamiento
 * propio, y cualquier hijo con `position: fixed` queda ENCERRADO en él: por muy
 * alto que sea su `z-index`, no puede situarse por encima de un hermano del
 * ancestro (como el navbar). Con el portal, el diálogo es hermano directo del
 * navbar y su `z-index` (2001 frente a 1000) sí decide quién va delante.
 */

const ICONOS_POR_VARIANTE = {
  success: '✓',
  error: '!',
  warning: '!',
  danger: '!',
  info: 'i',
  default: 'i'
};

/** Nº de pop-ups abiertos, para no desbloquear el scroll si queda alguno. */
let popupsAbiertos = 0;

/**
 * Diálogo genérico.
 *
 * @param {boolean}  open             Si está abierto. Cuando es false no renderiza nada.
 * @param {Function} onClose          Cierre por Escape, clic en el velo o botón ✕.
 * @param {string}   title            Título.
 * @param {string}   [subtitle]       Texto bajo el título.
 * @param {string}   [icon]           Icono; si se omite se deduce de `variant`.
 * @param {string}   [variant]        'success' | 'error' | 'warning' | 'danger' | 'info'.
 * @param {string}   [size]           'narrow' | 'wide'.
 * @param {boolean}  [closeOnBackdrop=true]
 * @param {boolean}  [showClose=true]
 * @param {ReactNode} [footer]        Botonera.
 * @param {ReactNode} children       Cuerpo.
 */
export default function Popup({
  open,
  onClose,
  title,
  subtitle,
  icon,
  variant = 'default',
  size,
  closeOnBackdrop = true,
  showClose = true,
  footer,
  children
}) {
  const dialogRef = useRef(null);
  // Elemento que tenía el foco antes de abrir, para devolverlo al cerrar.
  const focoPrevioRef = useRef(null);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  // Cierre con Escape. Se escucha en document porque el foco puede estar en
  // cualquier parte del diálogo.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  // Bloqueo del scroll del fondo mientras hay un pop-up abierto.
  // El contador evita que, al cerrar uno de dos pop-ups anidados, se restaure
  // el scroll con el otro todavía visible.
  useEffect(() => {
    if (!open) return undefined;

    popupsAbiertos += 1;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      popupsAbiertos = Math.max(0, popupsAbiertos - 1);
      if (popupsAbiertos === 0) {
        document.body.style.overflow = overflowOriginal;
      }
    };
  }, [open]);

  // Mover el foco al diálogo al abrir y devolverlo al cerrar: sin esto, quien
  // navega con teclado sigue en la página de detrás y no alcanza los botones.
  useEffect(() => {
    if (!open) return undefined;

    focoPrevioRef.current = document.activeElement;

    const foco = requestAnimationFrame(() => {
      const nodo = dialogRef.current;
      if (!nodo) return;

      const enfocable = nodo.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href]'
      );
      (enfocable || nodo).focus();
    });

    return () => {
      cancelAnimationFrame(foco);
      const previo = focoPrevioRef.current;
      if (previo && typeof previo.focus === 'function') previo.focus();
    };
  }, [open]);

  if (!open) return null;

  const clasesDialogo = [
    'popup-dialog',
    variant && variant !== 'default' ? `popup-dialog--${variant}` : '',
    size ? `popup-dialog--${size}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const iconoMostrado = icon || ICONOS_POR_VARIANTE[variant] || ICONOS_POR_VARIANTE.default;

  const contenido = (
    <div
      className="popup-backdrop"
      onMouseDown={(event) => {
        // Solo cierra si el clic empieza Y acaba en el velo: así arrastrar para
        // seleccionar texto dentro del diálogo no lo cierra por accidente.
        if (closeOnBackdrop && event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={clasesDialogo}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
      >
        {(title || showClose) && (
          <div className="popup-header">
            {iconoMostrado && (
              <div className="popup-icon" aria-hidden="true">
                {iconoMostrado}
              </div>
            )}

            <div className="popup-titles">
              {title && <h2 className="popup-title">{title}</h2>}
              {subtitle && <p className="popup-subtitle">{subtitle}</p>}
            </div>

            {showClose && (
              <button
                type="button"
                className="popup-close"
                onClick={handleClose}
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {children && <div className="popup-body">{children}</div>}

        {footer && <div className="popup-footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
}

/**
 * Pop-up informativo con un único botón. Reemplaza a `window.alert()`.
 */
export function AlertPopup({
  open,
  onClose,
  title,
  message,
  variant = 'info',
  confirmLabel = 'Entendido'
}) {
  return (
    <Popup open={open} onClose={onClose} title={title} variant={variant}>
      <p>{message}</p>

      <div className="popup-footer">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {confirmLabel}
        </button>
      </div>
    </Popup>
  );
}

/**
 * Pop-up de confirmación. Reemplaza a `window.confirm()`.
 *
 * @param {string}  [note]        Texto destacado con las consecuencias de la acción.
 * @param {boolean} [loading]     Deshabilita los botones mientras se procesa.
 * @param {string}  [error]       Error de la última acción, mostrado dentro del diálogo.
 * @param {boolean} [destructive] Pinta el botón de confirmar como acción peligrosa.
 */
export function ConfirmPopup({
  open,
  onCancel,
  onConfirm,
  title = '¿Confirmas la acción?',
  message,
  note,
  variant = 'warning',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  error = null,
  children
}) {
  return (
    <Popup
      open={open}
      // Mientras se procesa no se puede cerrar: evita dejar la operación a medias
      // sin saber si se completó.
      onClose={loading ? () => {} : onCancel}
      closeOnBackdrop={!loading}
      showClose={!loading}
      title={title}
      variant={variant}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      {message && <p>{message}</p>}
      {children}
      {note && (
        <div className={`popup-note ${destructive ? 'popup-note--danger' : 'popup-note--warning'}`}>
          {note}
        </div>
      )}
      {error && <div className="popup-error">{error}</div>}
    </Popup>
  );
}
