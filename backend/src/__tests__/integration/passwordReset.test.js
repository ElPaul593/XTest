/**
 * Recuperación de contraseña de extremo a extremo.
 *
 * El servicio de correo se sustituye por un doble: el envío real lo hace la API
 * consumidora por HTTP (ver services/mailerService.js) y los tests no deben
 * salir a la red. El doble además permite capturar el enlace generado y extraer
 * de él el token, que es justo lo que haría el usuario al abrir el correo.
 */

jest.mock('../../services/mailerService', () => {
  const real = jest.requireActual('../../services/mailerService');
  return {
    // La plantilla sí es la de verdad: así el test comprueba que el enlace se
    // incrusta correctamente en el HTML que recibe el usuario.
    construirCorreoResetPassword: real.construirCorreoResetPassword,
    enviarCorreo: jest.fn().mockResolvedValue({ ok: true, id: 'test-mail-id' })
  };
});

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MailerService = require('../../services/mailerService');
const AuthService = require('../../services/authService');

let mongoServer;
let app;
let originalMongoUri;

const USUARIO = {
  cedula: '1722108188',
  email: 'reset.test@example.com',
  nombre: 'Ana',
  apellido: 'Torres',
  telefono: '0987654321',
  paisOrigen: 'Ecuador',
  password: 'password123'
};

/** Extrae el token del enlace incrustado en el último correo enviado. */
function tokenDelUltimoCorreo() {
  const llamadas = MailerService.enviarCorreo.mock.calls;
  if (llamadas.length === 0) return null;

  const { html, text } = llamadas[llamadas.length - 1][0];
  const match = String(html || text).match(/\/api\/auth\/reset-password\/([a-f0-9]{64})/);
  return match ? match[1] : null;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  originalMongoUri = process.env.MONGO_URI;
  process.env.MONGO_URI = mongoServer.getUri();
  app = require('../../app');
  await mongoose.connection.asPromise();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (originalMongoUri === undefined) delete process.env.MONGO_URI;
  else process.env.MONGO_URI = originalMongoUri;
});

beforeEach(async () => {
  const User = require('../../models/userModel');
  await User.deleteMany({});
  MailerService.enviarCorreo.mockClear();
  await AuthService.register(USUARIO);
});

describe('Recuperación de contraseña', () => {
  describe('POST /api/auth/forgot-password', () => {
    test('envía el correo a través de la API consumidora y guarda solo el hash del token', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: USUARIO.email })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(MailerService.enviarCorreo).toHaveBeenCalledTimes(1);

      const correo = MailerService.enviarCorreo.mock.calls[0][0];
      expect(correo.to).toBe(USUARIO.email);
      expect(correo.meta.tipo).toBe('reset-password');

      const token = tokenDelUltimoCorreo();
      expect(token).toMatch(/^[a-f0-9]{64}$/);

      // En la BD solo debe quedar el hash: el token en claro nunca se persiste.
      const User = require('../../models/userModel');
      const guardado = await User.findOne({ email: USUARIO.email })
        .select('+resetPasswordTokenHash +resetPasswordExpires');

      expect(guardado.resetPasswordTokenHash).toBeTruthy();
      expect(guardado.resetPasswordTokenHash).not.toBe(token);
      expect(guardado.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    test('responde igual con un correo inexistente y no envía nada (no permite enumerar usuarios)', async () => {
      const existente = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: USUARIO.email })
        .expect(200);

      MailerService.enviarCorreo.mockClear();

      const inexistente = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'no.existe@example.com' })
        .expect(200);

      expect(inexistente.body.message).toBe(existente.body.message);
      expect(MailerService.enviarCorreo).not.toHaveBeenCalled();
    });

    test('rechaza un correo con formato inválido', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'esto-no-es-un-correo' })
        .expect(400);

      expect(MailerService.enviarCorreo).not.toHaveBeenCalled();
    });

    test('si el envío falla, no deja el token vigente en la base de datos', async () => {
      MailerService.enviarCorreo.mockResolvedValueOnce({ ok: false, error: 'SMTP caído' });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: USUARIO.email })
        .expect(502);

      const User = require('../../models/userModel');
      const guardado = await User.findOne({ email: USUARIO.email })
        .select('+resetPasswordTokenHash');

      expect(guardado.resetPasswordTokenHash).toBeNull();
    });
  });

  describe('GET /api/auth/reset-password/:token', () => {
    test('devuelve el formulario HTML cuando el token es válido', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      const response = await request(app)
        .get(`/api/auth/reset-password/${token}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('Restablecer contraseña');
      expect(response.text).toContain('backdrop-filter'); // glassmorphism
    });

    test('devuelve 400 y una página de aviso si el token no existe', async () => {
      const response = await request(app)
        .get(`/api/auth/reset-password/${'f'.repeat(64)}`)
        .expect(400);

      expect(response.text).toContain('Enlace no válido');
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    test('cambia la contraseña y permite iniciar sesión con la nueva', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'nuevaClave456' })
        .expect(200);

      // La nueva contraseña funciona...
      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: 'nuevaClave456' })
        .expect(200);

      // ...y la antigua ya no.
      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: USUARIO.password })
        .expect(401);
    });

    test('el token solo sirve una vez', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'nuevaClave456' })
        .expect(200);

      await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'otraClave789' })
        .expect(400);
    });

    test('rechaza un token caducado', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      // Se adelanta la caducidad en la BD para no esperar 30 minutos.
      const User = require('../../models/userModel');
      await User.updateOne(
        { email: USUARIO.email },
        { $set: { resetPasswordExpires: new Date(Date.now() - 1000) } }
      );

      await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: 'nuevaClave456' })
        .expect(400);
    });

    test('rechaza una contraseña demasiado corta', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: '123' })
        .expect(400);
    });

    test('rechaza reutilizar la contraseña actual', async () => {
      await request(app).post('/api/auth/forgot-password').send({ email: USUARIO.email });
      const token = tokenDelUltimoCorreo();

      const response = await request(app)
        .post(`/api/auth/reset-password/${token}`)
        .send({ password: USUARIO.password })
        .expect(400);

      expect(String(response.body.message || response.body.error)).toMatch(/distinta/i);
    });
  });
});

/**
 * Recuperación cuando el usuario NO recuerda su correo.
 *
 * Es el caso que motivó aceptar cédula y pasaporte: antes el endpoint exigía el
 * correo, así que justo quien lo había olvidado se quedaba sin salida.
 */
describe('Recuperación por cédula o pasaporte', () => {
  test('acepta la cédula y envía el enlace al correo guardado', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ cedula: USUARIO.cedula })
      .expect(200);

    expect(MailerService.enviarCorreo).toHaveBeenCalledTimes(1);
    expect(MailerService.enviarCorreo.mock.calls[0][0].to).toBe(USUARIO.email);

    // Se devuelve la pista enmascarada para saber en qué bandeja mirar,
    // sin revelar la dirección completa.
    expect(res.body.destinoEnmascarado).toBeTruthy();
    expect(res.body.destinoEnmascarado).toContain('@');
    expect(res.body.destinoEnmascarado).not.toBe(USUARIO.email);
    expect(res.body.destinoEnmascarado).toContain('*');
  });

  test('el token generado por cédula sirve para cambiar la contraseña', async () => {
    await request(app).post('/api/auth/forgot-password').send({ cedula: USUARIO.cedula });
    const token = tokenDelUltimoCorreo();
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'otraClave999' })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ cedula: USUARIO.cedula, password: 'otraClave999' })
      .expect(200);
  });

  test('una cédula inexistente responde igual y no envía nada', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ cedula: '1710034065' })
      .expect(200);

    expect(MailerService.enviarCorreo).not.toHaveBeenCalled();
    expect(res.body.destinoEnmascarado).toBeNull();
  });

  test('sin ningún identificador responde 400', async () => {
    await request(app).post('/api/auth/forgot-password').send({}).expect(400);
    expect(MailerService.enviarCorreo).not.toHaveBeenCalled();
  });

  test('cuando se escribe el correo NO se devuelve la pista (ya se sabe cuál es)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: USUARIO.email })
      .expect(200);

    expect(res.body.destinoEnmascarado).toBeNull();
  });
});
