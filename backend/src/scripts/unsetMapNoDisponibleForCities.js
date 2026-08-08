/**
 * Script para borrar mapNoDisponible/mapNoDisponibleAt para rutas cuyos
 * origen/destino están en la lista de ciudades afectadas.
 * Ejecutar con: node src/scripts/unsetMapNoDisponibleForCities.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ruta = require('../models/rutaModel');

const CITIES = ['Cuenca', 'Santo Domingo', 'Salinas', 'Zamora', 'Montecristi', 'Santa Rosa'];

async function main() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/busreservation';
  if (!mongoURI) {
    console.error('MONGO_URI no definida');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('Conectado a MongoDB');

  const orClauses = [];
  for (const c of CITIES) {
    orClauses.push({ from: c });
    orClauses.push({ to: c });
  }

  const filter = { $or: orClauses };
  const update = { $unset: { mapNoDisponible: '', mapNoDisponibleAt: '' } };

  const res = await Ruta.updateMany(filter, update);
  console.log(`Matched: ${res.matchedCount || res.n || 0}, Modified: ${res.modifiedCount || res.nModified || 0}`);

  await mongoose.disconnect();
  console.log('Desconectado, terminado.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
