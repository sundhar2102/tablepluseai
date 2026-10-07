const express = require('express');
const router = express.Router();

const {
  createReservation,
  getCustomerReservations,
  getReservationById,
  cancelReservation,
  getOwnerReservations,
  updateOwnerReservationStatus,
} = require('../controllers/reservation.controller');

const { validate } = require('../middleware/validate');
const {
  createReservationSchema,
  updateReservationStatusSchema,
} = require('../validations/reservation.validation');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Customer Reservation Endpoints
router.post(
  '/reservations',
  authenticate,
  authorize('customer'),
  validate(createReservationSchema),
  createReservation
);

router.get(
  '/reservations',
  authenticate,
  authorize('customer'),
  getCustomerReservations
);

router.get(
  '/reservations/my',
  authenticate,
  authorize('customer'),
  getCustomerReservations
);

router.get(
  '/reservations/:id',
  authenticate,
  getReservationById
);

router.patch(
  '/reservations/:id/cancel',
  authenticate,
  cancelReservation
);

// Owner Reservation Endpoints
router.get(
  '/owner/reservations',
  authenticate,
  authorize('owner', 'admin'),
  getOwnerReservations
);

router.patch(
  '/owner/reservations/:id/status',
  authenticate,
  authorize('owner', 'admin'),
  validate(updateReservationStatusSchema),
  updateOwnerReservationStatus
);

module.exports = router;
