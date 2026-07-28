/**
 * Script para poblar la base de datos con lugares turísticos y rutas
 * Ejecutar con: node src/scripts/populateData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const LugarTuristico = require('../models/lugarTuristicoModel');
const Ruta = require('../models/rutaModel');
const { lugaresTuristicos, rutas } = require('../data/seedData');

// Conectar a la base de datos
const connectDB = async () => {
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
};

// Poblar lugares turísticos
const populateLugaresTuristicos = async () => {
  try {
    console.log('\n📍 Poblando lugares turísticos...');
    
    // Limpiar datos existentes
    const deletedCount = await LugarTuristico.deleteMany({});
    console.log(`   Eliminados ${deletedCount.deletedCount} lugares turísticos existentes`);
    
    // Insertar nuevos datos
    const lugaresInsertados = await LugarTuristico.insertMany(lugaresTuristicos);
    console.log(`   ✅ Insertados ${lugaresInsertados.length} lugares turísticos`);
    
    return lugaresInsertados.length;
  } catch (error) {
    console.error('❌ Error poblando lugares turísticos:', error);
    throw error;
  }
};

// Poblar rutas
const populateRutas = async () => {
  try {
    console.log('\n🛣️  Poblando rutas...');
    
    // Limpiar datos existentes
    const deletedCount = await Ruta.deleteMany({});
    console.log(`   Eliminados ${deletedCount.deletedCount} rutas existentes`);
    
    // Insertar nuevos datos
    const rutasInsertadas = await Ruta.insertMany(rutas);
    console.log(`   ✅ Insertadas ${rutasInsertadas.length} rutas`);
    
    return rutasInsertadas.length;
  } catch (error) {
    console.error('❌ Error poblando rutas:', error);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    await connectDB();
    
    const lugaresCount = await populateLugaresTuristicos();
    const rutasCount = await populateRutas();
    
    console.log('\n✨ ¡Base de datos poblada exitosamente!');
    console.log(`   📍 Lugares turísticos: ${lugaresCount}`);
    console.log(`   🛣️  Rutas: ${rutasCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  }
};

// Ejecutar
main();

