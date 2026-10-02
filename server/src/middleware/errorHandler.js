/**
 * Global error handler middleware.
 * Must be registered LAST with app.use(errorHandler).
 * Catches all errors thrown by controllers/services and formats a consistent response.
 * Never exposes stack traces or internal details to clients.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log to server console for debugging (stack trace visible only server-side)
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.error('[ERROR]', err);
  } else {
    console.error('[ERROR]', err.code || 'INTERNAL_ERROR', '-', err.message);
  }

  // Operational errors (AppError instances) — safe to expose message
  if (err.isOperational) {
    const body = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    if (err.details) body.error.details = err.details; // Joi field-level errors
    return res.status(err.statusCode).json(body);
  }

  // MySQL duplicate entry (e.g., duplicate email)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ERROR', message: 'A record with this value already exists.' },
    });
  }

  // Unknown / programming errors — do not expose internal details
  return res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
};

module.exports = { errorHandler };
