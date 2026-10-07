const Joi = require('joi');

const createOrderSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required()
    .messages({ 'number.base': 'Restaurant ID must be a valid number', 'any.required': 'Restaurant ID is required' }),
  tableId: Joi.number().integer().positive().optional().allow(null)
    .messages({ 'number.base': 'Table ID must be a valid number' }),
  items: Joi.array()
    .items(
      Joi.object({
        menuItemId: Joi.number().integer().positive().required()
          .messages({ 'any.required': 'Item ID is required' }),
        quantity: Joi.number().integer().min(1).max(99).required()
          .messages({ 'number.min': 'Quantity must be at least 1', 'any.required': 'Quantity is required' }),
      })
    )
    .min(1)
    .required()
    .messages({ 'array.min': 'Order must contain at least one item', 'any.required': 'Order items are required' }),
  specialNote: Joi.string().trim().max(500).allow('', null).optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('received', 'preparing', 'served', 'completed', 'cancelled')
    .required()
    .messages({ 'any.only': 'Status must be received, preparing, served, completed, or cancelled' }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
