/**
 * Script de diagnóstico: prueba fetchDirections() contra las rutas seed
 * No modifica la base de datos.
 * Ejecutar con: node src/scripts/diagnoseRoutes.js
 */

require('dotenv').config();

const mapsService = require('../services/mapsService');
const { rutas } = require('../data/seedData');

(async () => {
  const results = [];

  for (const r of rutas) {
    const key = `${r.from} -> ${r.to}`;
    try {
      const d = await mapsService.fetchDirections(r.from, r.to);
      results.push({ route: key, status: 'OK', duracionEstimada: d.duracionEstimada != null });
      console.log(`OK: ${key}`);
    } catch (err) {
      const isZero = err?.directionsStatus === 'ZERO_RESULTS' || err?.message === 'No existe ruta en auto entre estos puntos';
      const status = isZero ? 'ZERO_RESULTS' : (err?.directionsStatus || 'ERROR');
      results.push({ route: key, status });
      console.log(`${status}: ${key} (${err.message || err})`);
    }
  }

  const total = results.length;
  const zero = results.filter(r => r.status === 'ZERO_RESULTS').length;
  const ok = results.filter(r => r.status === 'OK').length;
  const other = total - zero - ok;

  console.log('\nSummary:');
  console.log(`  Total routes tested: ${total}`);
  console.log(`  OK: ${ok}`);
  console.log(`  ZERO_RESULTS: ${zero}`);
  console.log(`  Other errors: ${other}`);

  // list ZERO_RESULTS routes
  const zeros = results.filter(r => r.status === 'ZERO_RESULTS').map(r => r.route);
  if (zeros.length) {
    console.log('\nZERO_RESULTS routes:');
    zeros.forEach(z => console.log(` - ${z}`));
  }

  process.exit(0);
})();
