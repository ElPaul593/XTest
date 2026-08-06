/**
 * Migración idempotente para poblar horaSalida en rutas existentes.
 * Ejecutar con: node src/scripts/migrateHoraSalida.js
 * Dry-run opcional: node src/scripts/migrateHoraSalida.js --dry-run
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ruta = require('../models/rutaModel');
const { getDeterministicHoraSalida } = require('../utils/dateTimeUtils');

const isDryRun = process.argv.includes('--dry-run');

async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/busreservation';

    if (!mongoURI) {
      console.error('❌ Error: MONGO_URI no está definida en las variables de entorno');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
}

function buildHoraSalidaUpdates(rutas) {
  return rutas.map((ruta) => {
    const horaSalida = getDeterministicHoraSalida(ruta.from, ruta.to);
    return {
      id: String(ruta._id),
      name: ruta.name,
      from: ruta.from,
      to: ruta.to,
      horaSalida
    };
  });
}

async function main() {
  try {
    await connectDB();

    const rutasSinHoraSalida = await Ruta.find({
      $or: [
        { horaSalida: null },
        { horaSalida: '' }
      ]
    })
      .select('_id name from to horaSalida')
      .sort({ from: 1, to: 1 })
      .lean();

    if (rutasSinHoraSalida.length === 0) {
      console.log('ℹ️ No hay rutas pendientes de migración.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const updates = buildHoraSalidaUpdates(rutasSinHoraSalida);
    console.log(`\n🔎 Rutas encontradas sin horaSalida: ${updates.length}`);
    console.table(updates.map(({ name, from, to, horaSalida }) => ({ name, from, to, horaSalida })));

    if (isDryRun) {
      console.log('\n🧪 Dry-run activado: no se modificó ningún documento.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const bulkOps = updates.map((ruta) => ({
      updateOne: {
        filter: {
          _id: ruta.id,
          $or: [
            { horaSalida: null },
            { horaSalida: '' }
          ]
        },
        update: {
          $set: { horaSalida: ruta.horaSalida }
        }
      }
    }));

    const result = await Ruta.bulkWrite(bulkOps, { ordered: false });

    console.log(`\n✅ Migración completada.`);
    console.log(`   Coincidencias: ${result.matchedCount || 0}`);
    console.log(`   Modificadas: ${result.modifiedCount || 0}`);
    console.log(`   Insertadas: ${result.upsertedCount || 0}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error ejecutando la migración de horaSalida:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

main();