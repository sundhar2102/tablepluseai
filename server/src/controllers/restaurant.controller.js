const restaurantService = require('../services/restaurant.service');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/restaurants
 * Discover nearby restaurants, search, filter by cuisine/openNow/radius.
 */
const getRestaurants = catchAsync(async (req, res) => {
  const data = await restaurantService.getRestaurants(req.query);
  sendSuccess(res, 200, data, 'Restaurants retrieved successfully');
});

/**
 * GET /api/restaurants/:id
 * Retrieve comprehensive details for a restaurant including table availability & wait times.
 */
const getRestaurantById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userLat = req.query.lat !== undefined ? Number(req.query.lat) : null;
  const userLng = req.query.lng !== undefined ? Number(req.query.lng) : null;

  const data = await restaurantService.getRestaurantById(id, userLat, userLng);
  sendSuccess(res, 200, data, 'Restaurant details retrieved successfully');
});

/**
 * PATCH /api/restaurants/:id/tables/:tableId/status
 * Stage 6 Part 1 table status update & real-time broadcast trigger.
 */
const updateTableStatus = catchAsync(async (req, res) => {
  const { id, tableId } = req.params;
  const { status } = req.body;

  const data = await restaurantService.updateTableStatus(Number(id), Number(tableId), status);
  sendSuccess(res, 200, data, `Table ${data.table.tableNumber} status updated to ${status}`);
});

module.exports = {
  getRestaurants,
  getRestaurantById,
  updateTableStatus,
};
