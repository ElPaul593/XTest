/**
 * Crea o promueve un usuario Agente de Turismo (rol AGENTE).
 *
 * Uso:
 *   - Promover un usuario existente por cédula a AGENTE:
 *       node src/scripts/seedAgente.js --cedula 1722108188
 *   - Crear un agente nuevo (si la cédula no existe):
 *       node src/scripts/seedAgente.js --cedula 1722108188 --password Agente1234 --nombre Luis --apellido Mora --telefono 0999999999
 *
 * Variables de entorno equivalentes: AGENTE_CEDULA, AGENTE_PASSWORD, AGENTE_NOMBRE, AGENTE_APELLIDO, AGENTE_TELEFONO
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
  const cedula = getArg('cedula') || process.env.AGENTE_CEDULA;
  if (!cedula) {
    console.error('Falta --cedula (o AGENTE_CEDULA).');
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
    user.role = 'AGENTE';
    await user.save();
    console.log(`Usuario ${cedulaLimpia} promovido a AGENTE (${user.nombre} ${user.apellido}).`);
  } else {
    const password = getArg('password') || process.env.AGENTE_PASSWORD;
    if (!password) {
      console.error('El usuario no existe. Para crearlo indica --password (y opcional --nombre --apellido --telefono).');
      process.exit(1);
    }
    user = await AuthService.createUserAccount({
      cedula: cedulaLimpia,
      nombre: getArg('nombre') || process.env.AGENTE_NOMBRE || 'Agente',
      apellido: getArg('apellido') || process.env.AGENTE_APELLIDO || 'Turismo',
      telefono: getArg('telefono') || process.env.AGENTE_TELEFONO || '0999999999',
      password,
      paisOrigen: 'Ecuador',
      role: 'AGENTE'
    });
    console.log(`Agente creado: ${user.nombre} ${user.apellido} (cédula ${cedulaLimpia}).`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Error:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
