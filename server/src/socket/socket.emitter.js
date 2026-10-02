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
  getIO().to(`user:${userId}`).emit(event, data);
}

module.exports = { setIO, getIO, emitToRestaurant, emitToOwner, emitToTable, emitToOrder, emitToUser };
