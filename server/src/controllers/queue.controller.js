const queueService = require('../services/queue.service');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * Customer: POST /api/queue
 * Join walk-in queue
 */
const joinQueue = catchAsync(async (req, res) => {
  const result = await queueService.joinQueue({
    customerId: req.user.userId,
    restaurantId: req.body.restaurantId,
    partySize: req.body.partySize,
  });
  sendSuccess(res, 201, result, 'Successfully joined the walk-in queue');
});

/**
 * Customer: GET /api/queue
 * List customer queue entries
 */
const getCustomerQueue = catchAsync(async (req, res) => {
  const data = await queueService.getCustomerQueue(req.user.userId);
  sendSuccess(res, 200, data, 'Customer queue entries retrieved successfully');
});

/**
 * Customer / Owner: GET /api/queue/:id
 * Get queue entry details
 */
const getQueueById = catchAsync(async (req, res) => {
  const data = await queueService.getQueueById(Number(req.params.id), req.user);
  sendSuccess(res, 200, data, 'Queue entry retrieved successfully');
});

/**
 * Customer / Owner: PATCH /api/queue/:id/cancel
 * Cancel queue entry
 */
const cancelQueue = catchAsync(async (req, res) => {
  const data = await queueService.cancelQueue(Number(req.params.id), req.user);
  sendSuccess(res, 200, data, 'Queue entry cancelled successfully');
});

/**
 * Owner: GET /api/owner/queue
 * Get owner's restaurant queue
 */
const getOwnerQueue = catchAsync(async (req, res) => {
  const data = await queueService.getOwnerQueue(req.user.userId, req.user.restaurantId);
  sendSuccess(res, 200, data, 'Owner queue retrieved successfully');
});

/**
 * Owner: PATCH /api/owner/queue/:id/status
 * Update queue status (called, seated, cancelled)
 */
const updateOwnerQueueStatus = catchAsync(async (req, res) => {
  const data = await queueService.updateOwnerQueueStatus(
    Number(req.params.id),
    req.user.userId,
    req.user.restaurantId,
    req.body
  );
  sendSuccess(res, 200, data, 'Queue status updated successfully');
});

module.exports = {
  joinQueue,
  getCustomerQueue,
  getQueueById,
  cancelQueue,
  getOwnerQueue,
  updateOwnerQueueStatus,
};
