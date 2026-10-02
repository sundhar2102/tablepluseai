const Joi = require('joi');

/**
 * Joi validation schemas for authentication endpoints.
 */

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Name must be at least 2 characters' }),

  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),

  phone: Joi.string().trim().pattern(/^\+?[0-9\s\-]{7,20}$/).optional()
    .messages({ 'string.pattern.base': 'Please provide a valid phone number' }),

  password: Joi.string().min(8).max(72).required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be at most 72 characters',
    }),

  role: Joi.string().valid('customer', 'owner').default('customer'),
});

const loginSchema = Joi.object({
  email:    Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
  role:     Joi.string().valid('customer', 'owner', 'admin').optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(72).required(),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
