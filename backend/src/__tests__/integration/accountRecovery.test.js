const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../../services/authService');
const User = require('../../models/userModel');
const AccountRecovery = require('../../models/accountRecoveryModel');
const RecoveryEmailService = require('../../services/accountRecoveryEmailService');

let mongoServer;
let originalMongoUri;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  originalMongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (originalMongoUri === undefined) delete process.env.MONGO_URI;
});

beforeEach(async () => {
  await User.deleteMany({});
  await AccountRecovery.deleteMany({});
  jest.restoreAllMocks();
});

async function createBlockedUser() {
  const user = await AuthService.register({
    pasaporte: 'RECOVERY-001',
    email: 'recovery@example.com',
    nombre: 'Usuario',
    apellido: 'Recuperable',
    telefono: '0987654321',
    paisOrigen: 'Extranjero',
    password: 'password123'
  });
  return User.findByIdAndUpdate(user._id, { isDeleted: true }, { new: true });
}

describe('Recuperación segura de cuenta', () => {
  test('responde de forma genérica cuando los datos no coinciden', async () => {
    const result = await AuthService.requestRecovery({
      pasaporte: 'NO-EXISTE',
      email: 'unknown@example.com'
    });

    expect(result.message).toContain('Si los datos coinciden');
    expect(result.recoveryId).toBeUndefined();
  });

  test('envía código y reactiva la cuenta con el código correcto', async () => {
    const user = await createBlockedUser();
    let sentCode;
    jest.spyOn(RecoveryEmailService, 'sendCode').mockImplementation(async (email, code) => {
      expect(email).toBe('recovery@example.com');
      sentCode = code;
    });

    const request = await AuthService.requestRecovery({
      pasaporte: 'RECOVERY-001',
      email: 'recovery@example.com'
    });
    expect(request.recoveryId).toBeDefined();
    expect(sentCode).toMatch(/^\d{6}$/);

    const confirmation = await AuthService.confirmRecovery({
      recoveryId: request.recoveryId,
      code: sentCode,
      password: 'newPassword123'
    });

    expect(confirmation.message).toBe('Cuenta recuperada exitosamente');
    const restored = await User.findById(user._id).lean();
    expect(restored.isDeleted).toBe(false);
    expect(restored.deletedAt).toBeUndefined();
    await expect(AuthService.confirmRecovery({
      recoveryId: request.recoveryId,
      code: sentCode,
      password: 'anotherPassword123'
    })).rejects.toThrow('Código inválido o expirado');
  });
});
