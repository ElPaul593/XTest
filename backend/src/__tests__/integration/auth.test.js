const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../../services/authService');

let mongoServer;
let app;
let originalMongoUri;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  originalMongoUri = process.env.MONGO_URI;
  process.env.MONGO_URI = mongoUri;
  app = require('../../app');
  await mongoose.connection.asPromise();
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
  const User = require('../../models/userModel');
  await User.deleteMany({});
});

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    test('debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
          cedula: '1722108188',
        email: 'juan.test.register@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '0987654321',
        paisOrigen: 'Ecuador',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('nombre', 'Juan');
      expect(response.body.data).toHaveProperty('apellido', 'Pérez');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('debe retornar error 400 si faltan campos requeridos', async () => {
      const userData = {
        nombre: 'Juan'
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'fail');
      expect(response.body).toHaveProperty('message');
    });

    test('debe retornar error si no se proporciona cédula ni pasaporte', async () => {
      const userData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.test.missing@example.com',
        email: 'juan.test.nocedula@example.com',
        telefono: '0987654321',
        paisOrigen: 'Ecuador',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'fail');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba usando el servicio
      await AuthService.register({
          cedula: '1722108188',
        email: 'juan.test.login@example.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '0987654321',
        paisOrigen: 'Ecuador',
        password: 'password123'
      });
    });

    test('debe hacer login exitosamente con cédula', async () => {
      const loginData = {
          cedula: '1722108188',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('role');
    });

    test('debe retornar error 400 si las credenciales son inválidas', async () => {
      const loginData = {
          cedula: '1722108188',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'fail');
    });
  });
});

