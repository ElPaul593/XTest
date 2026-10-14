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

describe('Reglas de eliminación de usuarios', () => {
  test('elimina físicamente una cuenta sin historial', async () => {
    const user = await createUser('TEST-PASS-001');
    const result = await UserService.remove(user._id);

    expect(result.physicallyDeleted).toBe(true);
    expect(result.blocked).toBe(false);
    expect(await mongoose.model('User').findById(user._id)).toBeNull();
  });

  test('bloquea y conserva una cuenta con reservas', async () => {
    const user = await createUser('TEST-PASS-002');
    await Reserva.create({
      user: user._id,
      ruta: new mongoose.Types.ObjectId(),
      seatNumber: 1
    });

    const result = await UserService.remove(user._id);
    const storedUser = await mongoose.model('User').findById(user._id).lean();

    expect(result.physicallyDeleted).toBe(false);
    expect(result.blocked).toBe(true);
    expect(storedUser.isDeleted).toBe(true);
    expect(storedUser.deletedAt).toBeInstanceOf(Date);
    expect(await Reserva.countDocuments({ user: user._id })).toBe(1);
  });

  test('restaura desde administración una cuenta bloqueada y conserva su historial', async () => {
    const user = await createUser('TEST-PASS-003');
    await Reserva.create({
      user: user._id,
      ruta: new mongoose.Types.ObjectId(),
      seatNumber: 2
    });

    await UserService.remove(user._id);
    const result = await UserService.restore(user._id);
    const restoredUser = await mongoose.model('User').findById(user._id).lean();

    expect(result.restored).toBe(true);
    expect(restoredUser.isDeleted).toBe(false);
    expect(restoredUser.deletedAt).toBeUndefined();
    expect(await Reserva.countDocuments({ user: user._id })).toBe(1);
  });
});
