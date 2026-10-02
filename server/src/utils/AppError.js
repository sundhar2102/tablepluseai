/**
 * Custom operational error class.
 * Extends Error with HTTP status code and error code for consistent API responses.
 */
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode  = statusCode;
    this.code        = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
