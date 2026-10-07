const Joi = require('joi');

const joinQueueSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required()
    .messages({ 'number.base': 'Restaurant ID must be a valid number', 'any.required': 'Restaurant ID is required' }),
  partySize: Joi.number().integer().min(1).max(20).required()
    .messages({
      'number.min': 'Party size must be at least 1 person',
      'number.max': 'Party size cannot exceed 20 people',
      'any.required': 'Party size is required'
    }),
});

const updateQueueStatusSchema = Joi.object({
  status: Joi.string().valid('waiting', 'called', 'seated', 'cancelled', 'expired').required()
    .messages({ 'any.only': 'Status must be waiting, called, seated, cancelled, or expired' }),
  tableId: Joi.number().integer().positive().allow(null).optional(),
});

module.exports = {
  joinQueueSchema,
  updateQueueStatusSchema,
};
