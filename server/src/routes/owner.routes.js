const express = require('express');
const router = express.Router();

const ownerController = require('../controllers/owner.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
  updateOwnerTableStatusSchema,
  updateOwnerRestaurantSchema,
} = require('../validations/owner.validation');

// All owner routes require authenticated owner or admin
router.use('/owner', authenticate, authorize('owner', 'manager', 'admin'));

// Owner Dashboard Overview
router.get('/owner/dashboard', ownerController.getDashboardStats);
router.get('/owner/stats', ownerController.getDashboardStats);

// Owner Tables Management
router.get('/owner/tables', ownerController.getOwnerTables);
router.patch(
  '/owner/tables/:tableId/status',
  validate(updateOwnerTableStatusSchema),
  ownerController.updateTableStatus
);

// Owner Restaurant Profile
router.get('/owner/restaurant', ownerController.getRestaurantProfile);
router.patch(
  '/owner/restaurant',
  validate(updateOwnerRestaurantSchema),
  ownerController.updateRestaurantProfile
);

// Owner Customers
router.get('/owner/customers', ownerController.getOwnerCustomers);

// Owner Analytics
router.get('/owner/analytics', ownerController.getOwnerAnalytics);
router.get('/owner/reports', ownerController.getOwnerAnalytics);

// Owner Notifications
router.get('/owner/notifications', ownerController.getOwnerNotifications);
router.patch('/owner/notifications/:id/read', ownerController.markNotificationRead);

module.exports = router;
