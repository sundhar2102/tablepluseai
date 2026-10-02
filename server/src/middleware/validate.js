const AppError = require('../utils/AppError');

/**
 * validate(schema) middleware
 * Validates req.body against a Joi schema.
 * Strips unknown fields (allowUnknown: false enforced by schema).
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,   // collect ALL validation errors, not just first
    stripUnknown: true,    // silently remove unexpected fields
  });

  if (error) {
    const details = error.details.map((d) => ({
      field:   d.context?.key || 'unknown',
      message: d.message.replace(/['"]/g, ''),
    }));
    const err = new AppError(400, 'VALIDATION_ERROR', 'Request validation failed');
    err.details = details;
    return next(err);
  }

  req.body = value; // replace body with validated + stripped version
  next();
};

/**
 * validateQuery(schema) middleware
 * Validates req.query against a Joi schema.
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly:   false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => ({
      field:   d.context?.key || 'unknown',
      message: d.message.replace(/['"]/g, ''),
    }));
    const err = new AppError(400, 'VALIDATION_ERROR', 'Query validation failed');
    err.details = details;
    return next(err);
  }

  req.query = value;
  next();
};

module.exports = { validate, validateQuery };
