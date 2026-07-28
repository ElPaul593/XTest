require('dotenv').config();
const mongoose = require('mongoose');
const { lugaresTuristicos } = require('../src/data/seedData');
const LugarTuristico = require('../src/models/lugarTuristicoModel');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('Conectado. Limpiando coleccion...');
    await LugarTuristico.deleteMany({});
    console.log(`Insertando ${lugaresTuristicos.length} lugares con imagenes...`);
    await LugarTuristico.insertMany(lugaresTuristicos);
    const total = await LugarTuristico.countDocuments();
    const withImg = await LugarTuristico.countDocuments({ imagen: { $ne: '' } });
    console.log(`Total insertados: ${total} | Con imagen: ${withImg}`);
    process.exit(0);
  })
  .catch(e => { console.error(e.message); process.exit(1); });
