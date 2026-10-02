/**
 * Wraps async route handlers so errors are forwarded to Express error middleware.
 * Eliminates the need for try/catch in every controller.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
