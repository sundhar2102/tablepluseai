const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for sensitive endpoints.
 * Protects against brute-force attacks on auth routes.
 */

// Auth endpoints: max 10 requests per minute in production, relaxed in dev/test for automated testing
const authLimiter = rateLimit({
  windowMs:         60 * 1000, // 1 minute
  max:              process.env.NODE_ENV === 'production' ? 10 : 200,
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

// General API: max 200 requests per minute per IP (relaxed for dev/load testing)
const generalLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              process.env.NODE_ENV === 'production' ? 200 : 500000,
  standardHeaders:  true,
  legacyHeaders:    false,
  skip:             () => process.env.SKIP_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'test' || process.env.ENABLE_LOAD_TEST === 'true',
  message: {
    success: false,
    error: {
      code:    'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
});

module.exports = { authLimiter, generalLimiter };
