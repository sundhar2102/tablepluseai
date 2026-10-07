const Joi = require('joi');

const createCategorySchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Category name must be at least 2 characters', 'any.required': 'Category name is required' }),
  displayOrder: Joi.number().integer().min(0).default(0),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
});

const createMenuItemSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Category ID is required' }),
  name: Joi.string().trim().min(2).max(150).required()
    .messages({ 'string.min': 'Item name must be at least 2 characters', 'any.required': 'Item name is required' }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  price: Joi.number().positive().precision(2).required()
    .messages({ 'number.positive': 'Price must be greater than 0', 'any.required': 'Price is required' }),
  isVegetarian: Joi.boolean().default(false),
  photoUrl: Joi.string().uri().allow('', null).optional(),
  isAvailable: Joi.boolean().default(true),
  preparationTimeMins: Joi.number().integer().min(1).max(180).default(15),
  displayOrder: Joi.number().integer().min(0).default(0),
});

const updateMenuItemSchema = Joi.object({
  categoryId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  price: Joi.number().positive().precision(2).optional(),
  isVegetarian: Joi.boolean().optional(),
  photoUrl: Joi.string().uri().allow('', null).optional(),
  isAvailable: Joi.boolean().optional(),
  preparationTimeMins: Joi.number().integer().min(1).max(180).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
};
