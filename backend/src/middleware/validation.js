const Joi = require('joi');
const AppError = require('../utils/AppError');

/**
 * Middleware de validación usando Joi
 * Valida body, query o params según se especifique
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errors, 400));
    }

    // Reemplazar los valores validados
    req[source] = value;
    next();
  };
};

module.exports = validate;

