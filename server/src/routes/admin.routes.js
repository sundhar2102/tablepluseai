const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All admin routes require authenticated admin
router.use('/admin', authenticate, authorize('admin'));

router.get('/admin/users', adminController.getAdminUsers);
router.get('/admin/restaurants', adminController.getAdminRestaurants);
router.patch('/admin/restaurants/:id/approval', adminController.updateRestaurantApproval);
router.get('/admin/stats', adminController.getAdminStats);
router.get('/admin/dashboard', adminController.getAdminStats);

module.exports = router;
