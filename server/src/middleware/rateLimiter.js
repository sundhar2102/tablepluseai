const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for sensitive endpoints.
 * Protects against brute-force attacks on auth routes.
 */

// Auth endpoints: max 10 requests per minute per IP
const authLimiter = rateLimit({
  windowMs:         60 * 1000, // 1 minute
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts. Please wait a minute before trying again.',
    },
  },
});

// General API: max 200 requests per minute per IP (relaxed for dev)
const generalLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
});

module.exports = { authLimiter, generalLimiter };
