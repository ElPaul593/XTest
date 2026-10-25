/**
 * #28BUG — Constante muerta: `BOLETOS_SAMPLE` no se importa en ninguna pantalla.
 *
 * Son datos de maqueta (rutas Quito–Guayaquil con precios y empresas inventadas)
 * de cuando la vista de boletos no tenía backend. Hoy `pages/Boletos.jsx` carga
 * las rutas reales con `getRutas()`, así que estos registros no se muestran nunca.
 *
 * Verificado: 0 importaciones de `BOLETOS_SAMPLE` en `pages/` y `components/`.
 *
 * Conviene no confundirlos con datos reales al leer el proyecto: las fechas que
 * contienen ('2025-10-15' y siguientes) ya están en el pasado.
 */
// Datos de ejemplo de boletos disponibles
export const BOLETOS_SAMPLE = [
  {
    id: 1,
    origen: 'Quito',
    destino: 'Guayaquil',
    fecha: '2025-10-15',
    hora: '08:00',
    precio: '$12.50',
    asientos: 45,
    empresa: 'TransEcuador'
  },
  {
    id: 2,
    origen: 'Cuenca',
    destino: 'Quito',
    fecha: '2025-10-15',
    hora: '14:30',
    precio: '$15.00',
    asientos: 32,
    empresa: 'Buses del Sur'
  },
  {
    id: 3,
    origen: 'Guayaquil',
    destino: 'Cuenca',
    fecha: '2025-10-16',
    hora: '06:45',
    precio: '$10.00',
    asientos: 28,
    empresa: 'Rápido Express'
  }
];

