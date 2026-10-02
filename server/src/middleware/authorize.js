const AppError = require('../utils/AppError');

/**
 * authorize(...roles) middleware
 * Must be used AFTER authenticate middleware.
 * Checks that req.user.role is in the allowed roles list.
 *
 * Usage:
 *   router.get('/owner/dashboard', authenticate, authorize('owner'), controller)
 *   router.get('/admin/panel',     authenticate, authorize('admin'), controller)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
  }
  next();
};

module.exports = { authorize };
