const Joi = require('joi');

const createReservationSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required()
    .messages({ 'number.base': 'Restaurant ID must be a valid number', 'any.required': 'Restaurant ID is required' }),
  reservationDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    .messages({ 'string.pattern.base': 'Reservation date must be in YYYY-MM-DD format', 'any.required': 'Reservation date is required' }),
  reservationTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).required()
    .messages({ 'string.pattern.base': 'Reservation time must be in HH:MM format', 'any.required': 'Reservation time is required' }),
  partySize: Joi.number().integer().min(1).max(20).required()
    .messages({
      'number.min': 'Party size must be at least 1 person',
      'number.max': 'Party size cannot exceed 20 people',
      'any.required': 'Party size is required'
    }),
  specialNote: Joi.string().trim().max(500).allow('', null).optional(),
});

const updateReservationStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'rejected', 'completed', 'no_show', 'cancelled').required()
    .messages({ 'any.only': 'Status must be pending, confirmed, rejected, completed, no_show, or cancelled' }),
  rejectionReason: Joi.string().trim().max(500).allow('', null).optional(),
  tableId: Joi.number().integer().positive().allow(null).optional(),
});

module.exports = {
  createReservationSchema,
  updateReservationStatusSchema,
};
