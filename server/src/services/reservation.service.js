const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  emitReservationCreated,
  emitReservationStatusChanged,
  emitToRestaurant,
} = require('../socket/socket.emitter');

/**
 * Format database row into client-friendly object.
 */
function formatReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    restaurantId: row.restaurant_id,
    tableId: row.table_id || null,
    reservationDate: row.reservation_date instanceof Date
      ? row.reservation_date.toISOString().split('T')[0]
      : String(row.reservation_date).slice(0, 10),
    reservationTime: String(row.reservation_time).slice(0, 5),
    partySize: Number(row.party_size),
    status: row.status,
    specialNote: row.special_note || null,
    rejectionReason: row.rejection_reason || null,
    expiresAt: row.expires_at || null,
    createdAt: row.created_at || null,
    restaurantName: row.restaurant_name || undefined,
    restaurantAddress: row.restaurant_address || undefined,
    restaurantPhone: row.restaurant_phone || undefined,
    tableNumber: row.table_number || undefined,
    tableCapacity: row.table_capacity ? Number(row.table_capacity) : undefined,
    customerName: row.customer_name || undefined,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
  };
}

/**
 * Create a new table reservation (Customer).
 */
async function createReservation(param1, param2) {
  let customerId;
  let payload;
  if (typeof param1 === 'object' && param1 !== null && !param2) {
    customerId = param1.customerId;
    payload = param1;
  } else {
    customerId = param1;
    payload = param2 || {};
  }

  const { restaurantId, reservationDate, reservationTime, partySize, specialNote } = payload;

  // 1. Verify restaurant exists, is approved, and active
  const [restRows] = await pool.query(
    'SELECT id, name, avg_dining_duration_mins, approval_status, is_active FROM restaurants WHERE id = ?',
    [restaurantId]
  );
  const restaurant = restRows[0];
  if (!restaurant) {
    throw new AppError(404, 'NOT_FOUND', 'Restaurant not found');
  }
  if (restaurant.approval_status !== 'approved' || !restaurant.is_active) {
    throw new AppError(400, 'RESTAURANT_INACTIVE', 'This restaurant is not currently accepting reservations');
  }

  // 2. Validate reservation date (cannot be in the past)
  const todayStr = new Date().toISOString().split('T')[0];
  if (reservationDate < todayStr) {
    throw new AppError(400, 'INVALID_DATE', 'Reservation date cannot be in the past');
  }

  // 3. Verify operating hours for that day
  const resDateObj = new Date(`${reservationDate}T00:00:00`);
  const dayOfWeek = resDateObj.getDay(); // 0 = Sun ... 6 = Sat
  const [hourRows] = await pool.query(
    'SELECT day_of_week, open_time, close_time, is_closed FROM restaurant_hours WHERE restaurant_id = ? AND day_of_week = ?',
    [restaurantId, dayOfWeek]
  );
  const hours = hourRows[0];
  if (hours && hours.is_closed) {
    throw new AppError(400, 'RESTAURANT_CLOSED', 'The restaurant is closed on the selected day');
  }
  if (hours && hours.open_time && hours.close_time) {
    const timeFormatted = reservationTime.length === 5 ? `${reservationTime}:00` : reservationTime;
    const openTime = hours.open_time;
    const closeTime = hours.close_time;
    let withinHours = false;
    if (closeTime >= openTime) {
      withinHours = timeFormatted >= openTime && timeFormatted <= closeTime;
    } else {
      withinHours = timeFormatted >= openTime || timeFormatted <= closeTime;
    }
    if (!withinHours) {
      throw new AppError(400, 'OUTSIDE_HOURS', `Reservation time is outside restaurant operating hours (${openTime.slice(0, 5)} - ${closeTime.slice(0, 5)})`);
    }
  }

  // 4. Duplicate booking prevention for same customer at same restaurant on same date
  const [dupRows] = await pool.query(
    `SELECT id, reservation_time, status 
     FROM reservations 
     WHERE customer_id = ? 
       AND restaurant_id = ? 
       AND reservation_date = ? 
       AND status IN ('pending', 'confirmed')`,
    [customerId, restaurantId, reservationDate]
  );

  const durationMins = restaurant.avg_dining_duration_mins || 60;
  const requestedMins = timeToMinutes(reservationTime);

  for (const dup of dupRows) {
    const existingMins = timeToMinutes(dup.reservation_time);
    if (Math.abs(requestedMins - existingMins) < durationMins) {
      throw new AppError(
        409,
        'DUPLICATE_RESERVATION',
        `You already have an active reservation #${dup.id} at this restaurant around this time (${String(dup.reservation_time).slice(0, 5)})`
      );
    }
  }

  // 5. Check table capacity and availability
  const [candidateTables] = await pool.query(
    `SELECT id, table_number, capacity 
     FROM tables 
     WHERE restaurant_id = ? 
       AND capacity >= ? 
     ORDER BY capacity ASC, id ASC`,
    [restaurantId, partySize]
  );

  if (candidateTables.length === 0) {
    throw new AppError(
      400,
      'NO_SUITABLE_TABLE',
      `No active table found that can accommodate a party size of ${partySize}`
    );
  }

  // Check if any candidate table is free during requested slot
  const candidateIds = candidateTables.map(t => t.id);
  const [slotConflicts] = await pool.query(
    `SELECT table_id, reservation_time 
     FROM reservations 
     WHERE restaurant_id = ? 
       AND reservation_date = ? 
       AND status IN ('pending', 'confirmed') 
       AND table_id IN (?)`,
    [restaurantId, reservationDate, candidateIds]
  );

  const conflictedTableIds = new Set();
  for (const conf of slotConflicts) {
    const confMins = timeToMinutes(conf.reservation_time);
    if (Math.abs(requestedMins - confMins) < durationMins) {
      conflictedTableIds.add(conf.table_id);
    }
  }

  const availableTable = candidateTables.find(t => !conflictedTableIds.has(t.id));
  if (!availableTable) {
    throw new AppError(
      409,
      'SLOT_CONFLICT',
      'All suitable tables are fully booked for this time slot. Please choose an alternate time.'
    );
  }

  // 6. Calculate expiration (15 minutes after reservation time)
  const [hoursPart, minsPart] = reservationTime.split(':');
  const resDateTime = new Date(`${reservationDate}T${hoursPart.padStart(2, '0')}:${minsPart.padStart(2, '0')}:00`);
  const expiresAt = new Date(resDateTime.getTime() + 15 * 60 * 1000);

  // 7. Insert reservation
  const [insertResult] = await pool.query(
    `INSERT INTO reservations (
       customer_id, restaurant_id, table_id, reservation_date, reservation_time,
       party_size, status, special_note, expires_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
    [
      customerId,
      restaurantId,
      availableTable.id,
      reservationDate,
      reservationTime.length === 5 ? `${reservationTime}:00` : reservationTime,
      partySize,
      specialNote || null,
      expiresAt,
    ]
  );

  const reservationId = insertResult.insertId;

  // 8. Fetch complete reservation details
  const [fetchRows] = await pool.query(
    `SELECT 
       r.*, 
       res.name AS restaurant_name, 
       res.address AS restaurant_address, 
       res.phone AS restaurant_phone, 
       res.cover_photo_url, 
       t.table_number, 
       t.capacity AS table_capacity,
       u.name AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM reservations r
     JOIN restaurants res ON r.restaurant_id = res.id
     JOIN users u ON r.customer_id = u.id
     LEFT JOIN tables t ON r.table_id = t.id
     WHERE r.id = ?`,
    [reservationId]
  );

  const created = formatReservation(fetchRows[0]);

  // 9. Real-time broadcast
  emitReservationCreated(restaurantId, created);

  return created;
}

/**
 * Convert HH:MM[:SS] to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Get all reservations for a customer.
 */
async function getCustomerReservations(customerId, query = {}) {
  let sql = `
    SELECT 
      r.*, 
      res.name AS restaurant_name, 
      res.address AS restaurant_address, 
      res.phone AS restaurant_phone, 
      res.cover_photo_url, 
      t.table_number, 
      t.capacity AS table_capacity
    FROM reservations r
    JOIN restaurants res ON r.restaurant_id = res.id
    LEFT JOIN tables t ON r.table_id = t.id
    WHERE r.customer_id = ?
  `;
  const params = [customerId];

  if (query && query.status) {
    sql += ' AND r.status = ?';
    params.push(query.status);
  }

  sql += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC';

  const [rows] = await pool.query(sql, params);
  return rows.map(formatReservation);
}

/**
 * Get reservation by ID with authorization check.
 */
async function getReservationById(id, user) {
  const [rows] = await pool.query(
    `SELECT 
       r.*, 
       res.name AS restaurant_name, 
       res.address AS restaurant_address, 
       res.phone AS restaurant_phone, 
       res.cover_photo_url, 
       t.table_number, 
       t.capacity AS table_capacity,
       u.name AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM reservations r
     JOIN restaurants res ON r.restaurant_id = res.id
     JOIN users u ON r.customer_id = u.id
     LEFT JOIN tables t ON r.table_id = t.id
     WHERE r.id = ?`,
    [id]
  );

  const reservation = rows[0];
  if (!reservation) {
    throw new AppError(404, 'NOT_FOUND', 'Reservation not found');
  }

  // Ownership security check
  const isCustomer = user.role === 'customer' && Number(reservation.customer_id) === Number(user.userId);
  let isOwner = false;
  if (user.role === 'owner') {
    const [restRows] = await pool.query('SELECT id FROM restaurants WHERE owner_id = ?', [user.userId]);
    const ownerRestIds = restRows.map(r => Number(r.id));
    if (ownerRestIds.includes(Number(reservation.restaurant_id))) {
      isOwner = true;
    }
  }

  if (!isCustomer && !isOwner && user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this reservation');
  }

  return formatReservation(reservation);
}

/**
 * Cancel a reservation (Customer or Owner).
 */
async function cancelReservation(id, user, cancellationReason = '') {
  const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
  const reservation = rows[0];
  if (!reservation) {
    throw new AppError(404, 'NOT_FOUND', 'Reservation not found');
  }

  // Role authorization
  const isCustomer = user.role === 'customer' && Number(reservation.customer_id) === Number(user.userId);
  let isOwner = false;
  if (user.role === 'owner') {
    const [restRows] = await pool.query('SELECT id FROM restaurants WHERE owner_id = ?', [user.userId]);
    const ownerRestIds = restRows.map(r => Number(r.id));
    if (ownerRestIds.includes(Number(reservation.restaurant_id))) {
      isOwner = true;
    }
  }

  if (!isCustomer && !isOwner && user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to cancel this reservation');
  }

  if (['cancelled', 'completed', 'rejected', 'no_show'].includes(reservation.status)) {
    throw new AppError(400, 'INVALID_STATUS', `Reservation cannot be cancelled because it is already ${reservation.status}`);
  }

  await pool.query(
    "UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
    [id]
  );

  // If table was locked, free it
  if (reservation.table_id) {
    await pool.query(
      "UPDATE tables SET status = 'available' WHERE id = ? AND status = 'reserved'",
      [reservation.table_id]
    );
    emitToRestaurant(reservation.restaurant_id, 'restaurant:availability_updated', {
      restaurantId: reservation.restaurant_id,
      timestamp: new Date().toISOString(),
    });
  }

  const updated = { ...reservation, status: 'cancelled' };
  emitReservationStatusChanged(reservation.customer_id, reservation.restaurant_id, formatReservation(updated));

  return formatReservation(updated);
}

/**
 * Get reservations for an owner's restaurant.
 */
async function getOwnerReservations(ownerId, param2, param3) {
  let userRestId = param2;
  let query = param3;
  if (typeof param2 === 'object' && !param3) {
    query = param2;
    userRestId = null;
  }
  query = query || {};

  // Find owner's restaurant
  const [restRows] = await pool.query('SELECT id, name FROM restaurants WHERE owner_id = ?', [ownerId]);
  if (restRows.length === 0) {
    return { restaurantId: null, total: 0, reservations: [] };
  }
  const restId = restRows[0].id;

  let sql = `
    SELECT 
      r.*, 
      res.name AS restaurant_name,
      t.table_number, 
      t.capacity AS table_capacity,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone
    FROM reservations r
    JOIN restaurants res ON r.restaurant_id = res.id
    JOIN users u ON r.customer_id = u.id
    LEFT JOIN tables t ON r.table_id = t.id
    WHERE r.restaurant_id = ?
  `;
  const params = [restId];

  if (query.status) {
    sql += ' AND r.status = ?';
    params.push(query.status);
  }
  if (query.date) {
    sql += ' AND r.reservation_date = ?';
    params.push(query.date);
  }

  sql += ' ORDER BY r.reservation_date ASC, r.reservation_time ASC';

  const [rows] = await pool.query(sql, params);
  const formattedRows = rows.map(formatReservation);

  const result = {
    restaurantId: restId,
    total: formattedRows.length,
    reservations: formattedRows,
  };

  // Support array-style access if legacy caller expects array
  result[Symbol.iterator] = function* () {
    yield* formattedRows;
  };

  return result;
}

/**
 * Update reservation status (Owner).
 */
async function updateOwnerReservationStatus(id, ownerId, param3, param4) {
  let userRestId;
  let payload;
  if (param4 !== undefined) {
    userRestId = param3;
    payload = param4 || {};
  } else {
    payload = param3 || {};
  }

  const { status, rejectionReason, tableId } = payload;

  const [rows] = await pool.query(
    `SELECT r.*, res.owner_id 
     FROM reservations r 
     JOIN restaurants res ON r.restaurant_id = res.id 
     WHERE r.id = ?`,
    [id]
  );
  const reservation = rows[0];
  if (!reservation) {
    throw new AppError(404, 'NOT_FOUND', 'Reservation not found');
  }

  const isAuthorized =
    Number(reservation.owner_id) === Number(ownerId) ||
    (userRestId && Number(userRestId) === Number(reservation.restaurant_id));

  if (!isAuthorized) {
    throw new AppError(403, 'FORBIDDEN', 'You are not authorized to manage reservations for this restaurant');
  }

  // Validate table if provided
  let assignedTableId = reservation.table_id;
  if (tableId) {
    const [tableRows] = await pool.query(
      'SELECT id, capacity FROM tables WHERE id = ? AND restaurant_id = ?',
      [tableId, reservation.restaurant_id]
    );
    if (tableRows.length === 0) {
      throw new AppError(400, 'INVALID_TABLE', 'Selected table does not belong to this restaurant');
    }
    assignedTableId = tableId;
  }

  await pool.query(
    `UPDATE reservations 
     SET status = ?, 
         rejection_reason = ?, 
         table_id = ?, 
         updated_at = NOW() 
     WHERE id = ?`,
    [status, rejectionReason || null, assignedTableId, id]
  );

  // If confirmed, update table state if today
  const todayStr = new Date().toISOString().split('T')[0];
  const resDateStr = reservation.reservation_date instanceof Date
    ? reservation.reservation_date.toISOString().split('T')[0]
    : String(reservation.reservation_date).slice(0, 10);

  if (assignedTableId) {
    if (status === 'confirmed' && resDateStr === todayStr) {
      await pool.query("UPDATE tables SET status = 'reserved' WHERE id = ? AND status = 'available'", [assignedTableId]);
      emitToRestaurant(reservation.restaurant_id, 'restaurant:availability_updated', {
        restaurantId: reservation.restaurant_id,
        timestamp: new Date().toISOString(),
      });
    } else if (['completed', 'cancelled', 'rejected', 'no_show'].includes(status)) {
      await pool.query("UPDATE tables SET status = 'available' WHERE id = ? AND status = 'reserved'", [assignedTableId]);
      emitToRestaurant(reservation.restaurant_id, 'restaurant:availability_updated', {
        restaurantId: reservation.restaurant_id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const [updatedRows] = await pool.query(
    `SELECT 
       r.*, 
       res.name AS restaurant_name, 
       t.table_number, 
       t.capacity AS table_capacity,
       u.name AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM reservations r
     JOIN restaurants res ON r.restaurant_id = res.id
     JOIN users u ON r.customer_id = u.id
     LEFT JOIN tables t ON r.table_id = t.id
     WHERE r.id = ?`,
    [id]
  );

  const formatted = formatReservation(updatedRows[0]);
  emitReservationStatusChanged(reservation.customer_id, reservation.restaurant_id, formatted);

  return formatted;
}

module.exports = {
  createReservation,
  getCustomerReservations,
  getReservationById,
  cancelReservation,
  getOwnerReservations,
  updateOwnerReservationStatus,
};
