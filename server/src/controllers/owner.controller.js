const ownerService = require('../services/owner.service');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/owner/dashboard
 * Live overview of restaurant tables, crowd, wait time, orders, and reservations.
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const data = await ownerService.getDashboardStats(req.user);
  sendSuccess(res, 200, data, 'Owner dashboard stats retrieved successfully');
});

/**
 * GET /api/owner/tables
 * Detailed table management view with active orders and upcoming bookings.
 */
const getOwnerTables = catchAsync(async (req, res) => {
  const data = await ownerService.getOwnerTables(req.user);
  sendSuccess(res, 200, data, 'Owner tables retrieved successfully');
});

/**
 * PATCH /api/owner/tables/:tableId/status
 * Update table status (available, occupied, reserved, cleaning) with real-time broadcast.
 */
const updateTableStatus = catchAsync(async (req, res) => {
  const { tableId } = req.params;
  const { status } = req.body;
  const data = await ownerService.updateOwnerTableStatus(req.user, Number(tableId), status);
  sendSuccess(res, 200, data, `Table #${tableId} status updated to ${status}`);
});

/**
 * GET /api/owner/restaurant
 * Get owner's restaurant profile.
 */
const getRestaurantProfile = catchAsync(async (req, res) => {
  const data = await ownerService.getOwnerRestaurantProfile(req.user);
  sendSuccess(res, 200, data, 'Restaurant profile retrieved successfully');
});

/**
 * PATCH /api/owner/restaurant
 * Update owner's restaurant profile.
 */
const updateRestaurantProfile = catchAsync(async (req, res) => {
  const data = await ownerService.updateOwnerRestaurantProfile(req.user, req.body);
  sendSuccess(res, 200, data, 'Restaurant profile updated successfully');
});

/**
 * GET /api/owner/customers
 * Get customers who have ordered or reserved at this restaurant.
 */
const getOwnerCustomers = catchAsync(async (req, res) => {
  const data = await ownerService.getOwnerCustomers(req.user);
  sendSuccess(res, 200, data, 'Owner customers retrieved successfully');
});

/**
 * GET /api/owner/analytics
 * Get real database analytics for this restaurant.
 */
const getOwnerAnalytics = catchAsync(async (req, res) => {
  const { timeframe } = req.query;
  const data = await ownerService.getOwnerAnalytics(req.user, timeframe);
  sendSuccess(res, 200, data, 'Owner analytics retrieved successfully');
});

/**
 * GET /api/owner/notifications
 * Get owner notifications and activity.
 */
const getOwnerNotifications = catchAsync(async (req, res) => {
  const data = await ownerService.getOwnerNotifications(req.user);
  sendSuccess(res, 200, data, 'Owner notifications retrieved successfully');
});

/**
 * PATCH /api/owner/notifications/:id/read
 * Mark notification as read.
 */
const markNotificationRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await ownerService.markNotificationAsRead(req.user, id);
  sendSuccess(res, 200, data, 'Notification marked as read');
});

module.exports = {
  getDashboardStats,
  getOwnerTables,
  updateTableStatus,
  getRestaurantProfile,
  updateRestaurantProfile,
  getOwnerCustomers,
  getOwnerAnalytics,
  getOwnerNotifications,
  markNotificationRead,
};
