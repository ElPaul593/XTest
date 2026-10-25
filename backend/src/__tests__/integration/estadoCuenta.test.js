/**
 * Bloqueo y baja de cuentas (baja lógica).
 *
 * El objetivo de estas pruebas es fijar la regla que motivó el cambio: dar de
 * baja una cuenta NO debe borrar el documento del usuario ni las reservas que lo
 * referencian. Si alguien vuelve a introducir un `findByIdAndDelete`, el test
 * "conserva el usuario y su reserva en la base de datos" falla.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AuthService = require('../../services/authService');

let mongoServer;
let app;
let originalMongoUri;

const USUARIO = {
  cedula: '1722108188',
  email: 'estado.usuario@example.com',
  nombre: 'Luis',
  apellido: 'Mora',
  telefono: '0987654321',
  paisOrigen: 'Ecuador',
  password: 'password123'
};

const ADMIN = {
  cedula: '1710034065',
  email: 'estado.admin@example.com',
  nombre: 'Admin',
  apellido: 'Root',
  telefono: '0987654322',
  paisOrigen: 'Ecuador',
  password: 'adminpass123',
  role: 'ADMIN'
};

let usuario;
let admin;
let tokenUsuario;
let tokenAdmin;

async function login({ cedula, password }) {
  const res = await request(app).post('/api/auth/login').send({ cedula, password }).expect(200);
  return res.body.token;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  originalMongoUri = process.env.MONGO_URI;
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-para-estado-de-cuenta';
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
  const Reserva = require('../../models/reservaModel');
  await User.deleteMany({});
  await Reserva.deleteMany({});

  usuario = await AuthService.register(USUARIO);
  admin = await AuthService.createUserAccount(ADMIN);

  tokenUsuario = await login({ cedula: USUARIO.cedula, password: USUARIO.password });
  tokenAdmin = await login({ cedula: ADMIN.cedula, password: ADMIN.password });
});

describe('Estado de cuenta', () => {
  describe('Usuarios previos a la migración', () => {
    test('una cuenta sin el campo `estado` se trata como ACTIVO', async () => {
      const User = require('../../models/userModel');
      // Se simula un documento antiguo quitando el campo por completo.
      await User.updateOne({ _id: usuario._id }, { $unset: { estado: '' } });

      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: USUARIO.password })
        .expect(200);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(200);

      expect(res.body.nombre).toBe('Luis');
    });
  });

  describe('Cuenta BLOQUEADA', () => {
    beforeEach(async () => {
      await request(app)
        .patch(`/api/users/${usuario._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'BLOQUEADO', motivo: 'Pago pendiente' })
        .expect(200);
    });

    test('no puede iniciar sesión y recibe el motivo', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: USUARIO.password })
        .expect(403);

      expect(String(res.body.message || res.body.error)).toMatch(/Pago pendiente/);
    });

    test('el token emitido ANTES del bloqueo deja de servir', async () => {
      // Este es el punto clave: los JWT viven 8 horas, así que el estado se
      // comprueba en cada petición y no solo en el login.
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(403);

      expect(res.body.estado).toBe('BLOQUEADO');
    });

    test('una contraseña incorrecta sigue dando 401, no 403', async () => {
      // El estado se revisa DESPUÉS de validar la contraseña: si se revisara
      // antes, cualquiera podría averiguar qué cuentas están bloqueadas sin
      // conocer las credenciales.
      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: 'contrasenaIncorrecta' })
        .expect(401);
    });

    test('al reactivarla vuelve a funcionar', async () => {
      await request(app)
        .patch(`/api/users/${usuario._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'ACTIVO' })
        .expect(200);

      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: USUARIO.password })
        .expect(200);

      // El motivo del bloqueo se limpia: ya no describe la situación actual.
      const res = await request(app)
        .get(`/api/users/${usuario._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(res.body.estadoMotivo).toBeNull();
    });
  });

  describe('Baja de cuenta (DELETE /api/users/me)', () => {
    test('conserva el usuario y su reserva en la base de datos', async () => {
      const User = require('../../models/userModel');
      const Ruta = require('../../models/rutaModel');
      const Reserva = require('../../models/reservaModel');

      const ruta = await Ruta.create({
        name: 'Quito - Cuenca',
        from: 'Quito',
        to: 'Cuenca',
        price: 12,
        duration: '8h'
      });
      const reserva = await Reserva.create({ user: usuario._id, ruta: ruta._id, seatNumber: 7, fecha: '2026-12-01' });

      await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(200);

      // El documento del usuario NO se borra.
      const guardado = await User.findById(usuario._id);
      expect(guardado).not.toBeNull();
      expect(guardado.estado).toBe('ELIMINADO');

      // Y la reserva conserva su referencia resoluble al usuario.
      const reservaGuardada = await Reserva.findById(reserva._id).populate('user');
      expect(reservaGuardada).not.toBeNull();
      expect(reservaGuardada.user).not.toBeNull();
      expect(reservaGuardada.user.nombre).toBe('Luis');
    });

    test('después de la baja no se puede iniciar sesión', async () => {
      await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(200);

      await request(app)
        .post('/api/auth/login')
        .send({ cedula: USUARIO.cedula, password: USUARIO.password })
        .expect(410);
    });

    test('un usuario con rol USER puede darse de baja a sí mismo', async () => {
      // Antes el frontend llamaba a DELETE /api/users/:id, protegida con
      // requireAdminAccess, y un usuario normal recibía siempre 403 (#17BUG).
      await request(app)
        .delete(`/api/users/${usuario._id}`)
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(403);

      await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(200);
    });

    test('no se puede dar de baja dos veces', async () => {
      await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .expect(200);

      // El token ya no sirve, así que se repite por la vía administrativa.
      await request(app)
        .delete(`/api/users/${usuario._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(409);
    });
  });

  describe('PATCH /api/users/:id/estado', () => {
    test('un administrador no puede bloquearse a sí mismo', async () => {
      const res = await request(app)
        .patch(`/api/users/${admin._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'BLOQUEADO', motivo: 'prueba' })
        .expect(400);

      expect(String(res.body.error)).toMatch(/tu propia cuenta/i);
    });

    test('rechaza un estado no contemplado', async () => {
      await request(app)
        .patch(`/api/users/${usuario._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'SUSPENDIDO' })
        .expect(400);
    });

    test('rechaza repetir el estado actual', async () => {
      await request(app)
        .patch(`/api/users/${usuario._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'ACTIVO' })
        .expect(409);
    });

    test('requiere rol admin', async () => {
      await request(app)
        .patch(`/api/users/${admin._id}/estado`)
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .send({ estado: 'BLOQUEADO' })
        .expect(403);
    });
  });

  describe('Filtro por estado en el listado', () => {
    test('separa las cuentas activas de las bloqueadas', async () => {
      await request(app)
        .patch(`/api/users/${usuario._id}/estado`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'BLOQUEADO', motivo: 'prueba' })
        .expect(200);

      const activos = await request(app)
        .get('/api/users?estado=ACTIVO')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      const bloqueados = await request(app)
        .get('/api/users?estado=BLOQUEADO')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      const correos = (lista) => (Array.isArray(lista) ? lista : lista.data).map((u) => u.email);

      expect(correos(activos.body)).toContain(ADMIN.email);
      expect(correos(activos.body)).not.toContain(USUARIO.email);
      expect(correos(bloqueados.body)).toEqual([USUARIO.email]);
    });
  });
});
