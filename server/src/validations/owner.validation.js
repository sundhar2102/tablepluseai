const Joi = require('joi');

const updateOwnerTableStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'occupied', 'reserved', 'cleaning').required()
    .messages({ 'any.only': 'Status must be available, occupied, reserved, or cleaning' }),
});

const updateOwnerRestaurantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  cuisineType: Joi.string().trim().max(80).optional(),
  cuisine_type: Joi.string().trim().max(80).optional(),
  address: Joi.string().trim().min(5).max(500).optional(),
  phone: Joi.string().trim().max(25).optional(),
  coverPhotoUrl: Joi.string().uri().allow('', null).optional(),
  cover_photo_url: Joi.string().uri().allow('', null).optional(),
  avgDiningMins: Joi.number().integer().min(10).max(240).optional(),
  avg_dining_duration_mins: Joi.number().integer().min(10).max(240).optional(),
  avgCleaningMins: Joi.number().integer().min(2).max(60).optional(),
  avg_cleaning_duration_mins: Joi.number().integer().min(2).max(60).optional(),
  isActive: Joi.boolean().optional(),
  is_active: Joi.alternatives().try(Joi.boolean(), Joi.number().valid(0, 1)).optional(),
  weeklyHours: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      openTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
      closeTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
      isClosed: Joi.boolean().optional(),
    })
  ).optional(),
});

module.exports = {
  updateOwnerTableStatusSchema,
  updateOwnerRestaurantSchema,
};
