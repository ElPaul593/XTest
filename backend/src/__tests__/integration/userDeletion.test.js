const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../../services/authService');
const UserService = require('../../services/userService');
const Reserva = require('../../models/reservaModel');

let mongoServer;
let originalMongoUri;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  originalMongoUri = process.env.MONGO_URI;
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (originalMongoUri === undefined) {
    delete process.env.MONGO_URI;
  } else {
    process.env.MONGO_URI = originalMongoUri;
  }
});

beforeEach(async () => {
  await Promise.all([
    mongoose.model('User').deleteMany({}),
    Reserva.deleteMany({})
  ]);
});

const createUser = (pasaporte) => AuthService.register({
  pasaporte,
  email: `${pasaporte}@example.com`,
  nombre: 'Usuario',
  apellido: 'Prueba',
  telefono: '0987654321',
  paisOrigen: 'Extranjero',
  password: 'password123'
});

/**
 * ADAPTADO AL MODELO DE `estado` DURANTE LA FUSIÓN DE RAMAS.
 *
 * La versión original de este archivo probaba un diseño distinto, basado en
 * `isDeleted` + `deletedAt`, en el que una cuenta SIN historial se borraba
 * físicamente y solo las que tenían datos asociados se bloqueaban.
 *
 * Al reconciliar las dos ramas se eligió el modelo de `estado`
 * (ACTIVO / BLOQUEADO / ELIMINADO), que NUNCA borra el documento. El motivo es el
 * requisito explícito del proyecto: la baja tiene que ser retrospectiva y no
 * puede perderse información. Un borrado físico, aunque sea solo para cuentas sin
 * historial, deja de cumplirlo en cuanto esa cuenta aparece en un informe, en una
 * auditoría o en una referencia creada más tarde.
 *
 * Se conserva la INTENCIÓN de las tres pruebas originales:
 *   1. dar de baja una cuenta sin historial funciona;
 *   2. dar de baja una cuenta con reservas conserva esas reservas;
 *   3. se puede restaurar y el historial sigue intacto.
 */
describe('Reglas de baja de usuarios (modelo de estado)', () => {
  test('dar de baja una cuenta sin historial la marca ELIMINADO y NO borra el documento', async () => {
    const user = await createUser('TEST-PASS-001');
    const result = await UserService.softDelete(user._id);

    expect(result.estado).toBe('ELIMINADO');

    // La diferencia clave con el diseño anterior: el documento sigue existiendo.
    const almacenado = await mongoose.model('User').findById(user._id).lean();
    expect(almacenado).not.toBeNull();
    expect(almacenado.estado).toBe('ELIMINADO');
    expect(almacenado.estadoCambiadoEn).toBeInstanceOf(Date);
  });

  test('dar de baja una cuenta con reservas conserva el usuario y sus reservas', async () => {
    const user = await createUser('TEST-PASS-002');
    await Reserva.create({
      user: user._id,
      ruta: new mongoose.Types.ObjectId(),
      seatNumber: 1
    });

    const result = await UserService.softDelete(user._id);
    const almacenado = await mongoose.model('User').findById(user._id).lean();

    expect(result.estado).toBe('ELIMINADO');
    expect(almacenado).not.toBeNull();
    expect(almacenado.estado).toBe('ELIMINADO');
    expect(almacenado.estadoMotivo).toBeTruthy();
    expect(await Reserva.countDocuments({ user: user._id })).toBe(1);

    // Y la referencia sigue siendo resoluble: es justo lo que rompía el borrado físico.
    const reserva = await Reserva.findOne({ user: user._id }).populate('user');
    expect(reserva.user).not.toBeNull();
    expect(reserva.user.nombre).toBe('Usuario');
  });

  test('bloquear es distinto de dar de baja y también conserva el historial', async () => {
    const user = await createUser('TEST-PASS-004');
    await Reserva.create({
      user: user._id,
      ruta: new mongoose.Types.ObjectId(),
      seatNumber: 3
    });

    const result = await UserService.cambiarEstado(user._id, 'BLOQUEADO', {
      motivo: 'Incumplimiento de las condiciones de uso'
    });

    expect(result.estado).toBe('BLOQUEADO');
    expect(result.estadoMotivo).toBe('Incumplimiento de las condiciones de uso');
    expect(await Reserva.countDocuments({ user: user._id })).toBe(1);
  });

  test('restaurar una cuenta la devuelve a ACTIVO y conserva su historial', async () => {
    const user = await createUser('TEST-PASS-003');
    await Reserva.create({
      user: user._id,
      ruta: new mongoose.Types.ObjectId(),
      seatNumber: 2
    });

    await UserService.softDelete(user._id);
    const result = await UserService.cambiarEstado(user._id, 'ACTIVO');
    const restaurado = await mongoose.model('User').findById(user._id).lean();

    expect(result.estado).toBe('ACTIVO');
    expect(restaurado.estado).toBe('ACTIVO');
    // Al reactivar se limpia el motivo: ya no describe la situación actual.
    expect(restaurado.estadoMotivo).toBeNull();
    expect(await Reserva.countDocuments({ user: user._id })).toBe(1);
  });
});
