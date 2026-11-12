/**
 * Añade salidas fechadas a las rutas existentes sin borrar rutas ni reservas.
 * Ejecutar desde backend con: npm run populate:salidas
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Ruta = require('../models/rutaModel');

const salidasBase = [
  { fecha: '2026-11-12', horaSalida: '07:00', activo: true },
  { fecha: '2026-12-24', horaSalida: '07:00', activo: true },
  { fecha: '2027-01-02', horaSalida: '20:00', activo: true }
];

async function main() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/busreservation';
  await mongoose.connect(mongoURI);
  const rutas = await Ruta.find({}, { _id: 1, salidas: 1 });
  let actualizadas = 0;

  for (const ruta of rutas) {
    const existentes = Array.isArray(ruta.salidas) ? ruta.salidas.map((salida) => ({
      fecha: salida.fecha,
      horaSalida: salida.horaSalida,
      activo: salida.activo !== false
    })) : [];
    const claves = new Set(existentes.map((salida) => `${salida.fecha}|${salida.horaSalida}`));
    const nuevas = salidasBase.filter((salida) => !claves.has(`${salida.fecha}|${salida.horaSalida}`));

    if (nuevas.length) {
      ruta.salidas = [...existentes, ...nuevas];
      await ruta.save();
      actualizadas += 1;
    }
  }

  console.log(`✅ Salidas añadidas a ${actualizadas} rutas; no se eliminaron datos.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('❌ No se pudieron poblar las salidas:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
