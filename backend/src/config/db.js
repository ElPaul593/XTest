const mongoose = require('mongoose');

// En Mongoose moderno, desactivar buffering evita timeouts largos cuando no hay conexión.
mongoose.set('bufferCommands', false);

const connectDb = async () => {
  const uri = process.env.MONGO_URI || '';
  
  // Validar que la URI esté presente y tenga el formato correcto
  if (!uri) {
    console.warn('⚠️  Advertencia: MONGO_URI no está definida en las variables de entorno');
    console.warn('El servidor iniciará pero las funcionalidades de base de datos no estarán disponibles.');
    console.warn('Por favor, crea un archivo .env con la siguiente variable:');
    console.warn('MONGO_URI=mongodb://localhost:27017/busreservation');
    console.warn('O para MongoDB Atlas:');
    console.warn('MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database');
    return; // No bloquear el inicio del servidor
  }

  // Validar formato básico de la URI
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.warn('⚠️  Advertencia: MONGO_URI debe comenzar con "mongodb://" o "mongodb+srv://"');
    console.warn('URI actual:', uri.substring(0, 20) + '...');
    console.warn('El servidor iniciará pero las funcionalidades de base de datos no estarán disponibles.');
    return; // No bloquear el inicio del servidor
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket
    });
    console.log('✅ MongoDB conectado satisfactoriamente');
    
    // Manejar errores de conexión después de conectarse
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB después de conectarse:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado. Intentando reconectar...');
    });
    
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    
    if (err.message.includes('authentication failed')) {
      console.error('💡 Verifica tus credenciales de usuario y contraseña');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('💡 No se pudo conectar al servidor. Posibles causas:');
      console.error('   - Verifica la URL de conexión');
      console.error('   - Verifica que tu IP esté permitida en MongoDB Atlas (Network Access)');
      console.error('   - Verifica tu conexión a internet');
      console.error('   - Si usas MongoDB Atlas, asegúrate de permitir acceso desde "0.0.0.0/0" (todas las IPs)');
    } else if (err.message.includes('querySrv')) {
      console.error('💡 Error de DNS (querySrv). Verifica:');
      console.error('   - La URL de conexión de MongoDB Atlas');
      console.error('   - Tu conexión a internet');
      console.error('   - Si estás detrás de un proxy/firewall');
    }
    
    console.warn('⚠️  El servidor continuará ejecutándose, pero las funcionalidades de base de datos no estarán disponibles.');
    console.warn('💡 Puedes intentar reconectar reiniciando el servidor después de corregir el problema.');
    
    // No bloquear el inicio del servidor - permitir que al menos el frontend funcione
    // El servidor intentará reconectar automáticamente en futuras peticiones
  }
};

module.exports = connectDb;
