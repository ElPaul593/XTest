require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

server.on('error', (err) => {
  console.error('Server error:', err && err.message ? err.message : err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
