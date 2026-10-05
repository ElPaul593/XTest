/**
 * Wrapper para manejar errores asíncronos en Express
 * Elimina la necesidad de try/catch repetitivos en los controllers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

