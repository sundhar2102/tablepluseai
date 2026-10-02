/**
 * Standard API response helpers.
 * All API responses use these helpers to guarantee consistent shape.
 *
 * Success: { success: true, data: ..., message: ... }
 * Error:   { success: false, error: { code: ..., message: ... } }
 */

const sendSuccess = (res, statusCode = 200, data = null, message = null) => {
  const body = { success: true };
  if (data    !== null) body.data    = data;
  if (message !== null) body.message = message;
  return res.status(statusCode).json(body);
};

const sendError = (res, statusCode = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred') => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { sendSuccess, sendError };
