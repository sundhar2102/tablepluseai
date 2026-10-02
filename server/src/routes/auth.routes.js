const express = require('express');
const router  = express.Router();

const { authenticate }  = require('../middleware/authenticate');
const { authorize }     = require('../middleware/authorize');
const { validate }      = require('../middleware/validate');
const { authLimiter }   = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require('../validations/auth.validation');
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/auth.controller');

// Public auth routes (rate-limited)
router.post('/register',      authLimiter, validate(registerSchema), register);
router.post('/auth/register', authLimiter, validate(registerSchema), register);
router.post('/login',         authLimiter, validate(loginSchema),    login);
router.post('/auth/login',    authLimiter, validate(loginSchema),    login);
router.post('/logout',        authenticate, logout);
router.post('/auth/logout',   authenticate, logout);

// User profile (protected)
router.get('/users/me',             authenticate, getMe);
router.patch('/users/me',           authenticate, updateMe);
router.patch('/users/me/password',  authenticate, validate(changePasswordSchema), changePassword);

// Role authorization verification endpoints (Stage 5 technical verification)
router.get('/test/customer', authenticate, authorize('customer'), (req, res) => {
  res.json({ success: true, message: 'Customer access granted', role: req.user.role });
});
router.get('/test/owner', authenticate, authorize('owner'), (req, res) => {
  res.json({ success: true, message: 'Owner access granted', role: req.user.role });
});
router.get('/test/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted', role: req.user.role });
});

module.exports = router;
