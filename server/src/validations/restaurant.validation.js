const Joi = require('joi');

const restaurantQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).optional()
    .messages({ 'number.min': 'Latitude must be between -90 and 90', 'number.max': 'Latitude must be between -90 and 90' }),
  latitude: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional()
    .messages({ 'number.min': 'Longitude must be between -180 and 180', 'number.max': 'Longitude must be between -180 and 180' }),
  longitude: Joi.number().min(-180).max(180).optional(),
  radius: Joi.number().positive().max(100).default(5)
    .messages({ 'number.positive': 'Radius must be a positive number', 'number.max': 'Radius cannot exceed 100 km' }),
  search: Joi.string().trim().max(100).allow('').optional(),
  area: Joi.string().trim().max(100).allow('').optional(),
  cuisine: Joi.string().trim().max(80).allow('').optional(),
  openNow: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
  priceRange: Joi.string().trim().optional(),
});

const updateTableStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'occupied', 'reserved', 'cleaning').required()
    .messages({ 'any.only': 'Status must be available, occupied, reserved, or cleaning' }),
});

module.exports = {
  restaurantQuerySchema,
  updateTableStatusSchema,
};
