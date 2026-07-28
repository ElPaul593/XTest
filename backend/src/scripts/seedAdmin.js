/**
 * Crea o promueve un usuario administrador (rol ADMIN).
 *
 * Uso:
 *   - Promover un usuario existente por cédula:
 *       node src/scripts/seedAdmin.js --cedula 1722108188
 *   - Crear un admin nuevo (si la cédula no existe):
 *       node src/scripts/seedAdmin.js --cedula 1722108188 --password Admin1234 --nombre Ana --apellido Perez --telefono 0999999999
 *
 * Variables de entorno equivalentes: ADMIN_CEDULA, ADMIN_PASSWORD, ADMIN_NOMBRE, ADMIN_APELLIDO, ADMIN_TELEFONO
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const AuthService = require('../services/authService');

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const cedula = getArg('cedula') || process.env.ADMIN_CEDULA;
  if (!cedula) {
    console.error('Falta --cedula (o ADMIN_CEDULA).');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('Falta MONGO_URI en el entorno (.env).');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Conectado a', mongoose.connection.name);

  const cedulaLimpia = String(cedula).replace(/\D/g, '').slice(0, 10);
  let user = await User.findOne({ cedula: cedulaLimpia });

  if (user) {
    user.role = 'ADMIN';
    await user.save();
    console.log(`Usuario ${cedulaLimpia} promovido a ADMIN (${user.nombre} ${user.apellido}).`);
  } else {
    const password = getArg('password') || process.env.ADMIN_PASSWORD;
    if (!password) {
      console.error('El usuario no existe. Para crearlo indica --password (y opcional --nombre --apellido --telefono).');
      process.exit(1);
    }
    user = await AuthService.createUserAccount({
      cedula: cedulaLimpia,
      nombre: getArg('nombre') || process.env.ADMIN_NOMBRE || 'Admin',
      apellido: getArg('apellido') || process.env.ADMIN_APELLIDO || 'Sistema',
      telefono: getArg('telefono') || process.env.ADMIN_TELEFONO || '0999999999',
      password,
      paisOrigen: 'Ecuador',
      role: 'ADMIN'
    });
    console.log(`Admin creado: ${user.nombre} ${user.apellido} (cédula ${cedulaLimpia}).`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Error:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
