const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validations/order.validation');

// Customer Order Endpoints
router.post(
  '/orders',
  authenticate,
  validate(createOrderSchema),
  orderController.createOrder
);

router.get(
  '/orders/my',
  authenticate,
  orderController.getMyOrders
);

router.get(
  '/orders/:id',
  authenticate,
  orderController.getOrderById
);

router.patch(
  '/orders/:id/cancel',
  authenticate,
  orderController.cancelOrder
);

// Owner / Manager Kitchen & Order Management Endpoints
router.get(
  '/owner/orders',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  orderController.getOwnerOrders
);

router.patch(
  '/owner/orders/:id/status',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
