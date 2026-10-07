/**
 * Socket.IO emit helpers.
 * All real-time broadcasts go through these functions.
 * Stage 5: placeholder structure. Stage 6 will fill in all business events.
 */

let _io = null;

function setIO(io) {
  _io = io;
}

function getIO() {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
}

// ── Emit to all customers viewing a restaurant ────────────────────────────
function emitToRestaurant(restaurantId, event, data) {
  getIO().to(`restaurant:${restaurantId}`).emit(event, data);
}

// ── Emit to the owner's dashboard room ───────────────────────────────────
function emitToOwner(restaurantId, event, data) {
  getIO().to(`owner:${restaurantId}`).emit(event, data);
}

// ── Emit to all users viewing a specific table ───────────────────────────
function emitToTable(tableId, event, data) {
  getIO().to(`table:${tableId}`).emit(event, data);
}

// ── Emit to all users tracking a specific order ──────────────────────────
function emitToOrder(orderId, event, data) {
  getIO().to(`order:${orderId}`).emit(event, data);
}

// ── Emit a personal event to a specific user ─────────────────────────────
function emitToUser(userId, event, data) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch (err) {
    console.warn(`[Socket Warn] Could not emit to user:${userId}:`, err.message);
  }
}

// ── Specific Stage 6 Part 2 Event Helpers ─────────────────────────────────
function emitReservationCreated(restaurantId, reservation) {
  try {
    emitToOwner(restaurantId, 'reservation:created', reservation);
    emitToUser(reservation.customer_id || reservation.customerId, 'reservation:created', reservation);
    emitToRestaurant(restaurantId, 'reservation:created', reservation);
  } catch (err) {
    console.warn('[Socket Warn] emitReservationCreated:', err.message);
  }
}

function emitReservationStatusChanged(userId, restaurantId, reservation) {
  try {
    emitToUser(userId, 'reservation:status_changed', reservation);
    emitToOwner(restaurantId, 'reservation:status_changed', reservation);
    emitToRestaurant(restaurantId, 'reservation:status_changed', reservation);
  } catch (err) {
    console.warn('[Socket Warn] emitReservationStatusChanged:', err.message);
  }
}

function emitQueueJoined(restaurantId, queueEntry) {
  try {
    emitToOwner(restaurantId, 'queue:joined', queueEntry);
    emitToUser(queueEntry.customer_id || queueEntry.customerId, 'queue:joined', queueEntry);
    emitToRestaurant(restaurantId, 'queue:joined', queueEntry);
    emitToRestaurant(restaurantId, 'queue:updated', { queueEntry });
  } catch (err) {
    console.warn('[Socket Warn] emitQueueJoined:', err.message);
  }
}

function emitQueueStatusChanged(userId, restaurantId, queueEntry) {
  try {
    emitToUser(userId, 'queue:status_changed', queueEntry);
    emitToOwner(restaurantId, 'queue:status_changed', queueEntry);
    emitToRestaurant(restaurantId, 'queue:position_updated', { restaurantId });
  } catch (err) {
    console.warn('[Socket Warn] emitQueueStatusChanged:', err.message);
  }
}

function emitQueuePositionUpdated(restaurantId, data = {}) {
  try {
    emitToRestaurant(restaurantId, 'queue:position_updated', data);
    emitToOwner(restaurantId, 'queue:position_updated', data);
  } catch (err) {
    console.warn('[Socket Warn] emitQueuePositionUpdated:', err.message);
  }
}

// ── Specific Stage 6 Part 3 Order Event Helpers ───────────────────────────
function emitOrderCreated(restaurantId, order) {
  try {
    emitToOwner(restaurantId, 'order:created', order);
    emitToUser(order.customer_id || order.customerId, 'order:created', order);
    emitToOrder(order.id, 'order:created', order);
    if (order.table_id || order.tableId) {
      emitToTable(order.table_id || order.tableId, 'order:created', order);
    }
  } catch (err) {
    console.warn('[Socket Warn] emitOrderCreated:', err.message);
  }
}

function emitOrderStatusChanged(userId, restaurantId, order) {
  try {
    emitToUser(userId, 'order:status_changed', order);
    emitToOwner(restaurantId, 'order:status_changed', order);
    emitToOrder(order.id, 'order:status_changed', order);
    if (order.table_id || order.tableId) {
      emitToTable(order.table_id || order.tableId, 'order:status_changed', order);
    }
  } catch (err) {
    console.warn('[Socket Warn] emitOrderStatusChanged:', err.message);
  }
}

// ── Specific Menu Event Helpers ───────────────────────────────────────────
function emitMenuUpdated(restaurantId) {
  try {
    emitToRestaurant(restaurantId, 'menu:updated', { restaurantId });
    emitToOwner(restaurantId, 'menu:updated', { restaurantId });
  } catch (err) {
    console.warn('[Socket Warn] emitMenuUpdated:', err.message);
  }
}

function emitMenuItemUpdated(restaurantId, item) {
  try {
    emitToRestaurant(restaurantId, 'menu:item_updated', { restaurantId, item });
    emitToOwner(restaurantId, 'menu:item_updated', { restaurantId, item });
    emitMenuUpdated(restaurantId);
  } catch (err) {
    console.warn('[Socket Warn] emitMenuItemUpdated:', err.message);
  }
}

function emitItemAvailabilityChanged(restaurantId, item) {
  try {
    emitToRestaurant(restaurantId, 'item:availability_changed', {
      restaurantId,
      itemId: item.id,
      isAvailable: Boolean(item.is_available),
      item
    });
    emitToOwner(restaurantId, 'item:availability_changed', {
      restaurantId,
      itemId: item.id,
      isAvailable: Boolean(item.is_available),
      item
    });
    emitMenuUpdated(restaurantId);
  } catch (err) {
    console.warn('[Socket Warn] emitItemAvailabilityChanged:', err.message);
  }
}

module.exports = {
  setIO,
  getIO,
  emitToRestaurant,
  emitToOwner,
  emitToTable,
  emitToOrder,
  emitToUser,
  emitReservationCreated,
  emitReservationStatusChanged,
  emitQueueJoined,
  emitQueueStatusChanged,
  emitQueuePositionUpdated,
  emitOrderCreated,
  emitOrderStatusChanged,
  emitMenuUpdated,
  emitMenuItemUpdated,
  emitItemAvailabilityChanged,
};



