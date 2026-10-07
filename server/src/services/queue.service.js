const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  emitQueueJoined,
  emitQueueStatusChanged,
  emitQueuePositionUpdated,
} = require('../socket/socket.emitter');

/**
 * Helper to check if restaurant is open today right now
 */
function isRestaurantCurrentlyOpen(hoursRows) {
  if (!hoursRows || hoursRows.length === 0) return true; // Default open if no specific hours recorded
  const now = new Date();
  const currentDay = now.getDay();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMins}:00`;

  const today = hoursRows.find((h) => Number(h.day_of_week) === currentDay);
  if (!today || today.is_closed) return false;
  return currentTime >= today.open_time && currentTime <= today.close_time;
}

/**
 * Calculate rule-based queue wait time
 */
function calculateQueueWaitTime(position, totalTables, avgDiningMins = 45) {
  if (position <= 1) {
    return {
      estimatedWaitMinutes: 5,
      calculationType: 'RULE_BASED',
      confidence: 'CURRENT_OPERATIONAL_ESTIMATE',
      reason: 'Next in line for available seating',
      isPrediction: false,
      disclaimer: 'This is a rule-based operational estimate, not an AI prediction.',
    };
  }

  const effectiveTables = Math.max(1, totalTables || 8);
  const turnoverPerTable = Math.max(3, Math.round(avgDiningMins / effectiveTables));
  const estimatedWait = Math.max(5, (position - 1) * turnoverPerTable);

  return {
    estimatedWaitMinutes: estimatedWait,
    calculationType: 'RULE_BASED',
    confidence: 'CURRENT_OPERATIONAL_ESTIMATE',
    reason: `Estimated turnover for ${position - 1} party ahead (${avgDiningMins}m avg dining / ${effectiveTables} tables)`,
    isPrediction: false,
    disclaimer: 'This is a rule-based operational estimate, not an AI prediction.',
  };
}

/**
 * Customer joins virtual walk-in queue
 */
async function joinQueue({ customerId, restaurantId, partySize }) {
  // 1. Validate restaurant
  const [restRows] = await pool.query(
    `SELECT id, name, slug, is_active, approval_status, avg_dining_duration_mins, avg_cleaning_duration_mins 
     FROM restaurants 
     WHERE id = ?`,
    [restaurantId]
  );

  if (restRows.length === 0) {
    throw new AppError('Restaurant not found', 404, 'NOT_FOUND');
  }

  const restaurant = restRows[0];
  if (!restaurant.is_active || restaurant.approval_status !== 'approved') {
    throw new AppError('This restaurant is not currently active for queueing', 400, 'RESTAURANT_INACTIVE');
  }

  // 2. Validate operating hours
  const [hours] = await pool.query(
    `SELECT day_of_week, open_time, close_time, is_closed 
     FROM restaurant_hours 
     WHERE restaurant_id = ?`,
    [restaurantId]
  );

  if (!isRestaurantCurrentlyOpen(hours)) {
    throw new AppError('Restaurant is currently closed. Walk-in queue is unavailable.', 400, 'RESTAURANT_CLOSED');
  }

  // 3. Check customer doesn't already have an active queue entry for this restaurant
  const [activeQueue] = await pool.query(
    `SELECT id, status, queue_position 
     FROM walk_in_queue 
     WHERE customer_id = ? AND restaurant_id = ? AND status IN ('waiting', 'called')`,
    [customerId, restaurantId]
  );

  if (activeQueue.length > 0) {
    throw new AppError(
      'You already have an active place in the queue for this restaurant.',
      409,
      'DUPLICATE_QUEUE_ENTRY'
    );
  }

  // 4. Determine current queue length and position
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as waitingCount 
     FROM walk_in_queue 
     WHERE restaurant_id = ? AND status = 'waiting'`,
    [restaurantId]
  );
  const position = Number(countRows[0].waitingCount) + 1;

  // 5. Total tables for wait-time calculation
  const [tableCountRows] = await pool.query(
    `SELECT COUNT(*) as total FROM tables WHERE restaurant_id = ?`,
    [restaurantId]
  );
  const totalTables = Number(tableCountRows[0].total) || 10;
  const waitEstimate = calculateQueueWaitTime(position, totalTables, restaurant.avg_dining_duration_mins);

  // 6. Insert new queue entry
  const [insertResult] = await pool.query(
    `INSERT INTO walk_in_queue (
       customer_id, restaurant_id, party_size, queue_position, status, joined_at
     ) VALUES (?, ?, ?, ?, 'waiting', NOW())`,
    [customerId, restaurantId, partySize, position]
  );

  const newQueueId = insertResult.insertId;

  const result = {
    id: newQueueId,
    customerId,
    restaurantId,
    restaurantName: restaurant.name,
    partySize,
    queuePosition: position,
    status: 'waiting',
    joinedAt: new Date().toISOString(),
    waitEstimation: waitEstimate,
    estimatedWaitMinutes: waitEstimate.estimatedWaitMinutes,
  };

  // 7. Emit real-time socket events
  emitQueueJoined(restaurantId, result);
  emitQueuePositionUpdated(restaurantId);

  return result;
}

/**
 * Get customer's queue entries with dynamic positions
 */
async function getCustomerQueue(customerId) {
  const [rows] = await pool.query(
    `SELECT 
       q.id, q.customer_id, q.restaurant_id, q.party_size, q.queue_position, 
       q.status, q.joined_at, q.called_at, q.expires_at, q.completed_at,
       r.name as restaurant_name, r.slug as restaurant_slug, r.address, r.phone,
       r.avg_dining_duration_mins
     FROM walk_in_queue q
     JOIN restaurants r ON q.restaurant_id = r.id
     WHERE q.customer_id = ?
     ORDER BY 
       CASE 
         WHEN q.status IN ('waiting', 'called') THEN 1 
         ELSE 2 
       END ASC,
       q.id DESC`,
    [customerId]
  );

  if (rows.length === 0) {
    return [];
  }

  // Enrich active entries with dynamic live queue positions and wait estimates
  const enriched = await Promise.all(
    rows.map(async (row) => {
      let livePosition = row.queue_position;
      let waitEstimate = null;

      if (row.status === 'waiting') {
        const [posRows] = await pool.query(
          `SELECT COUNT(*) as aheadCount 
           FROM walk_in_queue 
           WHERE restaurant_id = ? AND status = 'waiting' AND id <= ?`,
          [row.restaurant_id, row.id]
        );
        livePosition = Number(posRows[0].aheadCount);

        const [tableCountRows] = await pool.query(
          `SELECT COUNT(*) as total FROM tables WHERE restaurant_id = ?`,
          [row.restaurant_id]
        );
        const totalTables = Number(tableCountRows[0].total) || 10;
        waitEstimate = calculateQueueWaitTime(livePosition, totalTables, row.avg_dining_duration_mins);
      }

      return {
        id: row.id,
        customerId: row.customer_id,
        restaurantId: row.restaurant_id,
        restaurantName: row.restaurant_name,
        restaurantSlug: row.restaurant_slug,
        address: row.address,
        phone: row.phone,
        partySize: row.party_size,
        queuePosition: livePosition,
        originalPosition: row.queue_position,
        status: row.status,
        joinedAt: row.joined_at,
        calledAt: row.called_at,
        expiresAt: row.expires_at,
        completedAt: row.completed_at,
        waitEstimation: waitEstimate,
        estimatedWaitMinutes: waitEstimate ? waitEstimate.estimatedWaitMinutes : 0,
      };
    })
  );

  return enriched;
}

/**
 * Get queue entry by ID with authorization check
 */
async function getQueueById(id, user) {
  const [rows] = await pool.query(
    `SELECT 
       q.id, q.customer_id, q.restaurant_id, q.party_size, q.queue_position, 
       q.status, q.joined_at, q.called_at, q.expires_at, q.completed_at,
       r.name as restaurant_name, r.slug as restaurant_slug, r.address, r.phone,
       r.owner_id, r.avg_dining_duration_mins
     FROM walk_in_queue q
     JOIN restaurants r ON q.restaurant_id = r.id
     WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError('Queue entry not found', 404, 'NOT_FOUND');
  }

  const row = rows[0];

  // Authorization check
  const isCustomer = user.role === 'customer' && Number(row.customer_id) === Number(user.userId);
  const isOwner = user.role === 'owner' && (
    Number(row.owner_id) === Number(user.userId) || 
    (user.restaurantId && Number(user.restaurantId) === Number(row.restaurant_id))
  );

  if (!isCustomer && !isOwner) {
    throw new AppError('You are not authorized to view this queue entry', 403, 'FORBIDDEN');
  }

  let livePosition = row.queue_position;
  let waitEstimate = null;

  if (row.status === 'waiting') {
    const [posRows] = await pool.query(
      `SELECT COUNT(*) as aheadCount 
       FROM walk_in_queue 
       WHERE restaurant_id = ? AND status = 'waiting' AND id <= ?`,
      [row.restaurant_id, row.id]
    );
    livePosition = Number(posRows[0].aheadCount);

    const [tableCountRows] = await pool.query(
      `SELECT COUNT(*) as total FROM tables WHERE restaurant_id = ?`,
      [row.restaurant_id]
    );
    const totalTables = Number(tableCountRows[0].total) || 10;
    waitEstimate = calculateQueueWaitTime(livePosition, totalTables, row.avg_dining_duration_mins);
  }

  return {
    id: row.id,
    customerId: row.customer_id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
    address: row.address,
    phone: row.phone,
    partySize: row.party_size,
    queuePosition: livePosition,
    originalPosition: row.queue_position,
    status: row.status,
    joinedAt: row.joined_at,
    calledAt: row.called_at,
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
    waitEstimation: waitEstimate,
    estimatedWaitMinutes: waitEstimate ? waitEstimate.estimatedWaitMinutes : 0,
  };
}

/**
 * Cancel queue entry (customer or owner)
 */
async function cancelQueue(id, user) {
  const [rows] = await pool.query(
    `SELECT q.*, r.owner_id 
     FROM walk_in_queue q
     JOIN restaurants r ON q.restaurant_id = r.id
     WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError('Queue entry not found', 404, 'NOT_FOUND');
  }

  const row = rows[0];

  // Ownership verification
  const isCustomer = user.role === 'customer' && Number(row.customer_id) === Number(user.userId);
  const isOwner = user.role === 'owner' && (
    Number(row.owner_id) === Number(user.userId) || 
    (user.restaurantId && Number(user.restaurantId) === Number(row.restaurant_id))
  );

  if (!isCustomer && !isOwner) {
    throw new AppError('You are not authorized to cancel this queue entry', 403, 'FORBIDDEN');
  }

  if (['cancelled', 'seated', 'expired'].includes(row.status)) {
    throw new AppError(`Cannot cancel queue entry with status '${row.status}'`, 400, 'INVALID_STATUS');
  }

  await pool.query(
    `UPDATE walk_in_queue 
     SET status = 'cancelled', completed_at = NOW() 
     WHERE id = ?`,
    [id]
  );

  const updatedEntry = {
    ...row,
    status: 'cancelled',
    completedAt: new Date().toISOString(),
  };

  emitQueueStatusChanged(row.restaurant_id, updatedEntry);
  emitQueuePositionUpdated(row.restaurant_id);

  return updatedEntry;
}

/**
 * Owner: Get queue list for their restaurant
 */
async function getOwnerQueue(ownerId, userRestaurantId) {
  // 1. Resolve owner's restaurant
  let restId = userRestaurantId;
  if (!restId) {
    const [restRows] = await pool.query(
      `SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1`,
      [ownerId]
    );
    if (restRows.length === 0) {
      throw new AppError('No restaurant found for this owner', 404, 'RESTAURANT_NOT_FOUND');
    }
    restId = restRows[0].id;
  }

  // 2. Fetch queue items with customer details
  const [rows] = await pool.query(
    `SELECT 
       q.id, q.customer_id, q.restaurant_id, q.party_size, q.queue_position,
       q.status, q.joined_at, q.called_at, q.expires_at, q.completed_at,
       u.name as customer_name, u.phone as customer_phone
     FROM walk_in_queue q
     LEFT JOIN users u ON q.customer_id = u.id
     WHERE q.restaurant_id = ?
     ORDER BY 
       CASE 
         WHEN q.status = 'called' THEN 1
         WHEN q.status = 'waiting' THEN 2
         ELSE 3 
       END ASC,
       q.id ASC`,
    [restId]
  );

  // Compute live waiting positions
  let currentPos = 1;
  const enriched = rows.map((r) => {
    let livePos = null;
    if (r.status === 'waiting') {
      livePos = currentPos++;
    }

    return {
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name || 'Guest Customer',
      customerPhone: r.customer_phone ? `***-***-${r.customer_phone.slice(-4)}` : 'N/A', // Privacy safe masking
      partySize: r.party_size,
      queuePosition: livePos || r.queue_position,
      status: r.status,
      joinedAt: r.joined_at,
      calledAt: r.called_at,
      expiresAt: r.expires_at,
      completedAt: r.completed_at,
    };
  });

  return {
    restaurantId: restId,
    totalWaiting: enriched.filter((e) => e.status === 'waiting').length,
    totalCalled: enriched.filter((e) => e.status === 'called').length,
    queue: enriched,
  };
}

/**
 * Owner: Update queue status (called, seated, cancelled)
 */
async function updateOwnerQueueStatus(id, ownerId, userRestaurantId, { status }) {
  // 1. Fetch queue entry with restaurant owner check
  const [rows] = await pool.query(
    `SELECT q.*, r.owner_id 
     FROM walk_in_queue q
     JOIN restaurants r ON q.restaurant_id = r.id
     WHERE q.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError('Queue entry not found', 404, 'NOT_FOUND');
  }

  const entry = rows[0];

  // Authorization check
  const isAuthorized = 
    Number(entry.owner_id) === Number(ownerId) || 
    (userRestaurantId && Number(userRestaurantId) === Number(entry.restaurant_id));

  if (!isAuthorized) {
    throw new AppError('You are not authorized to manage queue for this restaurant', 403, 'FORBIDDEN');
  }

  // Validate state transitions
  if (status === 'called') {
    if (entry.status !== 'waiting') {
      throw new AppError(`Cannot call customer who is currently '${entry.status}'`, 400, 'INVALID_TRANSITION');
    }
    await pool.query(
      `UPDATE walk_in_queue 
       SET status = 'called', called_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
       WHERE id = ?`,
      [id]
    );
  } else if (status === 'seated') {
    if (!['waiting', 'called'].includes(entry.status)) {
      throw new AppError(`Cannot seat customer who is currently '${entry.status}'`, 400, 'INVALID_TRANSITION');
    }
    await pool.query(
      `UPDATE walk_in_queue 
       SET status = 'seated', completed_at = NOW() 
       WHERE id = ?`,
      [id]
    );
  } else if (status === 'cancelled') {
    if (['seated', 'cancelled', 'expired'].includes(entry.status)) {
      throw new AppError(`Cannot cancel entry that is already '${entry.status}'`, 400, 'INVALID_TRANSITION');
    }
    await pool.query(
      `UPDATE walk_in_queue 
       SET status = 'cancelled', completed_at = NOW() 
       WHERE id = ?`,
      [id]
    );
  } else {
    throw new AppError(`Unsupported queue status transition: '${status}'`, 400, 'INVALID_STATUS');
  }

  const [updatedRows] = await pool.query(`SELECT * FROM walk_in_queue WHERE id = ?`, [id]);
  const updatedEntry = updatedRows[0];

  // Emit real-time events
  emitQueueStatusChanged(entry.restaurant_id, updatedEntry);
  emitQueuePositionUpdated(entry.restaurant_id);

  return updatedEntry;
}

module.exports = {
  joinQueue,
  getCustomerQueue,
  getQueueById,
  cancelQueue,
  getOwnerQueue,
  updateOwnerQueueStatus,
};
