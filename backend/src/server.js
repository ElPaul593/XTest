require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

server.on('error', (err) => {
  // EADDRINUSE es, con mucha diferencia, el error más habitual al arrancar en
  // desarrollo: casi siempre hay otro `npm run dev` abierto en otra terminal.
  // El mensaje crudo de Node ("listen EADDRINUSE: address already in use
  // 0.0.0.0:5000") no dice qué hacer, así que se explica aquí.
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\n✖ El puerto ${PORT} ya está en uso.`);
    console.error('  Suele ser otra instancia de este mismo servidor. Opciones:');
    console.error(`    1) Cierra la otra terminal que esté ejecutando el backend.`);
    console.error(`    2) Mira qué proceso lo ocupa:   netstat -ano | findstr :${PORT}`);
    console.error(`       y ciérralo:                  taskkill /PID <pid> /F`);
    console.error(`    3) O arranca en otro puerto:    PORT=5001 npm run dev\n`);
    process.exit(1);
  }

  console.error('Server error:', err && err.message ? err.message : err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
