const AppError = require('../utils/AppError');

/**
 * Middleware centralizado para manejo de errores
 * Debe ser el último middleware registrado en app.js
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const message = String(err.message || '').toLowerCase();
  const isDbUnavailable =
    err.name === 'MongooseServerSelectionError' ||
    message.includes('buffering timed out') ||
    message.includes('before initial connection is complete') ||
    message.includes('topology is closed') ||
    message.includes('could not connect to any servers in your mongodb atlas cluster');

  if (isDbUnavailable) {
    return res.status(503).json({
      status: 'fail',
      message: 'Base de datos no disponible. Verifica MONGO_URI y Network Access en MongoDB Atlas.'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Valor inválido para ${err.path}`
    });
  }

  // Error de desarrollo: enviar stack trace
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Error operacional: enviar mensaje al cliente
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Error de programación: no filtrar detalles
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Algo salió mal'
  });
};

module.exports = errorHandler;

