const express = require('express');
const router = express.Router();

const {
  joinQueue,
  getCustomerQueue,
  getQueueById,
  cancelQueue,
  getOwnerQueue,
  updateOwnerQueueStatus,
} = require('../controllers/queue.controller');

const { validate } = require('../middleware/validate');
const {
  joinQueueSchema,
  updateQueueStatusSchema,
} = require('../validations/queue.validation');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Customer Queue Endpoints
router.post(
  '/queue',
  authenticate,
  authorize('customer'),
  validate(joinQueueSchema),
  joinQueue
);

router.get(
  '/queue',
  authenticate,
  authorize('customer'),
  getCustomerQueue
);

router.get(
  '/queue/:id',
  authenticate,
  getQueueById
);

router.patch(
  '/queue/:id/cancel',
  authenticate,
  cancelQueue
);

// Owner Queue Endpoints
router.get(
  '/owner/queue',
  authenticate,
  authorize('owner', 'admin'),
  getOwnerQueue
);

router.patch(
  '/owner/queue/:id/status',
  authenticate,
  authorize('owner', 'admin'),
  validate(updateQueueStatusSchema),
  updateOwnerQueueStatus
);

module.exports = router;
