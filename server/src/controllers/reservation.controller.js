const reservationService = require('../services/reservation.service');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * Customer: POST /api/reservations
 * Book a table
 */
const createReservation = catchAsync(async (req, res) => {
  const result = await reservationService.createReservation({
    customerId: req.user.userId,
    ...req.body,
  });
  sendSuccess(res, 201, result, 'Reservation created successfully');
});

/**
 * Customer: GET /api/reservations
 * List customer reservations
 */
const getCustomerReservations = catchAsync(async (req, res) => {
  const data = await reservationService.getCustomerReservations(req.user.userId);
  sendSuccess(res, 200, data, 'Customer reservations retrieved successfully');
});

/**
 * Customer / Owner: GET /api/reservations/:id
 * Get reservation details
 */
const getReservationById = catchAsync(async (req, res) => {
  const data = await reservationService.getReservationById(Number(req.params.id), req.user);
  sendSuccess(res, 200, data, 'Reservation retrieved successfully');
});

/**
 * Customer / Owner: PATCH /api/reservations/:id/cancel
 * Cancel a reservation
 */
const cancelReservation = catchAsync(async (req, res) => {
  const data = await reservationService.cancelReservation(
    Number(req.params.id),
    req.user,
    req.body.cancellationReason
  );
  sendSuccess(res, 200, data, 'Reservation cancelled successfully');
});

/**
 * Owner: GET /api/owner/reservations
 * List restaurant reservations for owner
 */
const getOwnerReservations = catchAsync(async (req, res) => {
  const data = await reservationService.getOwnerReservations(
    req.user.userId,
    req.user.restaurantId,
    req.query
  );
  sendSuccess(res, 200, data, 'Owner reservations retrieved successfully');
});

/**
 * Owner: PATCH /api/owner/reservations/:id/status
 * Update reservation status (confirm, reject, complete, etc.)
 */
const updateOwnerReservationStatus = catchAsync(async (req, res) => {
  const data = await reservationService.updateOwnerReservationStatus(
    Number(req.params.id),
    req.user.userId,
    req.user.restaurantId,
    req.body
  );
  sendSuccess(res, 200, data, 'Reservation status updated successfully');
});

module.exports = {
  createReservation,
  getCustomerReservations,
  getReservationById,
  cancelReservation,
  getOwnerReservations,
  updateOwnerReservationStatus,
};
