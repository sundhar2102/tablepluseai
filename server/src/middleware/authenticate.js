const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * authenticate middleware
 * Verifies the JWT from the Authorization: Bearer <token> header.
 * Attaches decoded user payload to req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return next(new AppError(401, 'TOKEN_MISSING', 'Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.'));
    }
    return next(new AppError(401, 'TOKEN_INVALID', 'Invalid authentication token'));
  }
};

module.exports = { authenticate };
