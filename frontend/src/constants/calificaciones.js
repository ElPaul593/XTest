// Opciones de calificación disponibles
export const OPCIONES_CALIFICACION = [
  { value: 1, label: '1 ⭐' },
  { value: 2, label: '2 ⭐⭐' },
  { value: 3, label: '3 ⭐⭐⭐' },
  { value: 4, label: '4 ⭐⭐⭐⭐' },
  { value: 5, label: '5 ⭐⭐⭐⭐⭐' }
];

/**
 * #29BUG — Constantes muertas: `CALIFICACION_MINIMA` y `CALIFICACION_MAXIMA` no
 * se importan en ninguna parte (`CALIFICACION_DEFAULT` y `OPCIONES_CALIFICACION`
 * sí se usan, en Destino.jsx y LugaresTuristicos.jsx).
 *
 * El rango 1–5 acaba hardcodeado en tres sitios distintos que deberían leerlo de
 * aquí: el `enum` de `OPCIONES_CALIFICACION` justo arriba, el esquema Joi del
 * backend y el `min`/`max` del modelo Mongoose `calificacionModel.js`. Si alguna
 * vez se pasara a 1–10, estas dos constantes serían las únicas que no habría que
 * cambiar, porque nadie las lee.
 *
 * Verificado: 0 importaciones en `pages/` y `components/`.
 */
export const CALIFICACION_MINIMA = 1;
export const CALIFICACION_MAXIMA = 5;
export const CALIFICACION_DEFAULT = 5;

