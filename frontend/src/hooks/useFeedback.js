import { useCallback, useState } from 'react';

/**
 * Estado de los avisos de una pantalla.
 *
 * Centraliza el patrón que antes se repetía en cada página con dos `useState`
 * (`error` y `success`) más un `alert()` suelto. Devuelve un único objeto de
 * aviso y las funciones para abrirlo y cerrarlo.
 *
 * Uso típico:
 *
 *   const { aviso, mostrarExito, mostrarError, cerrarAviso } = useFeedback();
 *   ...
 *   <AlertPopup
 *     open={!!aviso}
 *     variant={aviso?.variant}
 *     title={aviso?.title}
 *     message={aviso?.message}
 *     onClose={cerrarAviso}
 *   />
 *
 * Se mantiene un solo aviso a la vez a propósito: encadenar pop-ups obliga al
 * usuario a cerrarlos uno por uno, y el último mensaje es siempre el relevante.
 */
export default function useFeedback() {
  const [aviso, setAviso] = useState(null);

  const mostrarExito = useCallback((message, title = 'Operación completada') => {
    setAviso({ variant: 'success', title, message });
  }, []);

  const mostrarError = useCallback((message, title = 'No se pudo completar') => {
    // Los servicios lanzan `Error`; las respuestas de axios traen el texto en
    // `response.data.error`. Se acepta cualquiera de las tres formas para que
    // quien llama no tenga que normalizarlo.
    const texto =
      typeof message === 'string'
        ? message
        : message?.response?.data?.error ||
          message?.response?.data?.message ||
          message?.message ||
          'Ha ocurrido un error inesperado.';

    setAviso({ variant: 'error', title, message: texto });
  }, []);

  const mostrarInfo = useCallback((message, title = 'Información') => {
    setAviso({ variant: 'info', title, message });
  }, []);

  const cerrarAviso = useCallback(() => setAviso(null), []);

  return { aviso, mostrarExito, mostrarError, mostrarInfo, cerrarAviso };
}
