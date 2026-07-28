require('dotenv').config();
const mongoose = require('mongoose');
const LugarTuristico = require('../src/models/lugarTuristicoModel');

function keyFromDoc(doc) {
  const ciudad = String(doc.ciudad || '').trim().toLowerCase();
  const nombre = String(doc.nombre || '').trim().toLowerCase();
  return `${ciudad}|${nombre}`;
}

(async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/busreservation';
  await mongoose.connect(mongoUri);

  const docs = await LugarTuristico.find({})
    .sort({ createdAt: -1, _id: -1 })
    .select({ _id: 1, nombre: 1, ciudad: 1, createdAt: 1 })
    .lean();

  const seen = new Set();
  const idsToDelete = [];

  for (const doc of docs) {
    const key = keyFromDoc(doc);
    if (seen.has(key)) {
      idsToDelete.push(doc._id);
    } else {
      seen.add(key);
    }
  }

  let deleted = 0;
  if (idsToDelete.length > 0) {
    const result = await LugarTuristico.deleteMany({ _id: { $in: idsToDelete } });
    deleted = result.deletedCount || 0;
  }

  console.log(`Registros analizados: ${docs.length}`);
  console.log(`Duplicados eliminados: ${deleted}`);
  console.log(`Registros finales únicos: ${docs.length - deleted}`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Error limpiando duplicados:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
