/**
 * Custom operational error class.
 * Extends Error with HTTP status code and error code for consistent API responses.
 * Polymorphic constructor supports both:
 *   new AppError(statusCode, code, message)
 *   new AppError(message, statusCode, code)
 */
class AppError extends Error {
  constructor(param1, param2, param3) {
    let statusCode;
    let code;
    let message;

    if (typeof param1 === 'number') {
      statusCode = param1;
      code = param2 || 'ERROR';
      message = param3 || 'An error occurred';
    } else {
      message = param1 || 'An error occurred';
      statusCode = typeof param2 === 'number' ? param2 : 500;
      code = param3 || 'ERROR';
    }

    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
