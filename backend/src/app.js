require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const connectDb = require('./config/db');
const routes = require('./routes');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const app = express();

// Middlewares
app.use(compression()); // Comprimir respuestas gzip

/**
 * #15BUG CORREGIDO (en lo que se puede hacer sin romper el despliegue).
 *
 *  a) CORS. Antes era `origin: true` con `credentials: true`, lo que hace que el
 *     servidor refleje como permitido CUALQUIER origen que pregunte. Ahora hay
 *     lista blanca configurable (`CORS_ORIGINS` + `FRONTEND_URL` + localhost de
 *     desarrollo). Si no se configura ninguna, se mantiene el comportamiento
 *     anterior pero avisando por consola: así endurecer la seguridad no tumba un
 *     despliegue existente al que todavía le falte la variable.
 *
 *  b) CSP. Sigue desactivada de forma global y esto es deliberado: Swagger UI
 *     (`/api-docs`) inyecta scripts y estilos inline, y activar una CSP estricta
 *     en todo el servicio rompería la documentación de la API. En su lugar, la
 *     única página HTML propia que sirve el backend —la de restablecer
 *     contraseña— lleva su PROPIA CSP con nonce (ver `routes/authRoutes.js`),
 *     que es donde el riesgo era real porque la abre el usuario desde su correo.
 */

// Orígenes permitidos: variable CORS_ORIGINS (separados por coma), el host del
// frontend y los puertos habituales de desarrollo.
const CORS_ORIGINS = [
  ...String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  process.env.FRONTEND_URL,
  process.env.VERCEL_FRONTEND_URL
]
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, ''));

const CORS_ORIGINS_DEV = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const listaBlancaCors = [...new Set([...CORS_ORIGINS, ...CORS_ORIGINS_DEV])];
const corsSinConfigurar = CORS_ORIGINS.length === 0;

if (corsSinConfigurar) {
  console.warn(
    '[CORS] Ni CORS_ORIGINS ni FRONTEND_URL están definidas: se acepta cualquier origen.\n' +
    '       Define CORS_ORIGINS=https://tu-frontend.vercel.app para restringirlo.'
  );
}

app.use(
  helmet({
    // Ver (b) arriba: la CSP se aplica por ruta, no globalmente, para no romper
    // Swagger UI.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(cors({
  origin(origin, callback) {
    // Sin cabecera `Origin`: peticiones del propio servidor, Postman, curl o
    // navegaciones directas. No son peticiones entre sitios, así que pasan.
    if (!origin) return callback(null, true);

    // Compatibilidad: mientras no se configure la lista, se refleja el origen.
    if (corsSinConfigurar) return callback(null, true);

    if (listaBlancaCors.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origen rechazado: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Evitar 404 de favicon en consola del navegador
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Database
connectDb();

// Health check (antes de las rutas de API)
app.get('/health', (req, res) => res.json({ ok: true, name: 'BusReservation API' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes API (deben estar antes de los archivos estáticos)
app.use('/api', routes);

// Servir archivos estáticos del frontend (si existe la carpeta public)
const publicDir = path.join(__dirname, '..', 'public');
const fs = require('fs');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Catch-all handler: servir index.html para rutas del frontend (SPA routing)
  // IMPORTANTE: Este debe ir después de las rutas de API
  app.get('*', (req, res) => {
    // No servir index.html para rutas de API
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  // Si no hay frontend compilado, solo mostrar API
  app.get('/', (req, res) => res.json({ ok: true, name: 'BusReservation API' }));
}

// 404 handler (solo para rutas que no coincidieron arriba)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not Found' });
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// Error handler middleware (debe ser el último)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
