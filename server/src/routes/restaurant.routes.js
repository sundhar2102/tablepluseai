const express = require('express');
const router = express.Router();

const {
  getRestaurants,
  getRestaurantById,
  updateTableStatus,
} = require('../controllers/restaurant.controller');
const { validate, validateQuery } = require('../middleware/validate');
const {
  restaurantQuerySchema,
  updateTableStatusSchema,
} = require('../validations/restaurant.validation');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Customer discovery routes (public / read-only)
router.get('/restaurants', validateQuery(restaurantQuerySchema), getRestaurants);
router.get('/restaurants/:id', getRestaurantById);

// Stage 6 Part 1 verification endpoint: Owner/Admin table status modification & real-time trigger
router.patch(
  '/restaurants/:id/tables/:tableId/status',
  authenticate,
  authorize('owner', 'admin'),
  validate(updateTableStatusSchema),
  updateTableStatus
);

module.exports = router;
