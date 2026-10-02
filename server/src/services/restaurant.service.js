const { pool } = require('../config/db');
const { haversine } = require('../utils/haversine');
const { CROWD_LEVELS, TABLE_STATUS } = require('../config/constants');
const AppError = require('../utils/AppError');
const { getIO } = require('../socket/socket.emitter');

/**
 * Check if a restaurant is open given its hours rows and a reference date.
 * Returns { isOpen: boolean, todayHours: string }
 */
function checkIsOpen(hoursRows, now = new Date()) {
  if (!hoursRows || hoursRows.length === 0) {
    return { isOpen: false, todayHours: 'Hours not available' };
  }

  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const todayRow = hoursRows.find((h) => Number(h.day_of_week) === currentDay);

  if (!todayRow || todayRow.is_closed) {
    return { isOpen: false, todayHours: 'Closed today' };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const openTime = todayRow.open_time;
  const closeTime = todayRow.close_time;

  if (!openTime || !closeTime) {
    return { isOpen: false, todayHours: 'Hours not configured' };
  }

  const displayHours = `${openTime.slice(0, 5)} - ${closeTime.slice(0, 5)}`;

  // Normal daytime hours vs overnight
  let isOpen = false;
  if (closeTime >= openTime) {
    isOpen = currentTime >= openTime && currentTime <= closeTime;
  } else {
    // Overnight window (e.g. 18:00 to 02:00 next day)
    isOpen = currentTime >= openTime || currentTime <= closeTime;
  }

  return { isOpen, todayHours: displayHours };
}

/**
 * Transparent rule-based crowd level calculation.
 * Centralized threshold logic.
 */
function calculateCrowdLevel(available, occupied, reserved, cleaning, total) {
  if (total === 0) return CROWD_LEVELS.LOW;
  if (available === 0) return CROWD_LEVELS.FULL;

  const occupancyRatio = (occupied + reserved) / total;

  if (occupancyRatio >= 0.75) return CROWD_LEVELS.HIGH;
  if (occupancyRatio >= 0.40) return CROWD_LEVELS.MODERATE;
  return CROWD_LEVELS.LOW;
}

/**
 * Transparent rule-based wait-time estimation.
 * Explicitly transparent operational estimate — not an AI prediction.
 */
function calculateWaitTime(available, occupied, reserved, cleaning, total, avgDining = 45, avgCleaning = 10) {
  // If tables are immediately available, wait time is 0
  if (available > 0) {
    return {
      estimatedWaitMinutes: 0,
      calculationType: 'RULE_BASED',
      confidence: 'CURRENT_OPERATIONAL_ESTIMATE',
      reason: 'Tables are immediately available for seating',
      isPrediction: false,
      disclaimer: 'This is a rule-based operational estimate, not an AI prediction.',
    };
  }

  // If no tables are available but some are being cleaned, turnover is fast
  if (cleaning > 0) {
    return {
      estimatedWaitMinutes: Math.max(5, avgCleaning),
      calculationType: 'RULE_BASED',
      confidence: 'CURRENT_OPERATIONAL_ESTIMATE',
      reason: 'Table is currently undergoing sanitization/cleaning',
      isPrediction: false,
      disclaimer: 'This is a rule-based operational estimate, not an AI prediction.',
    };
  }

  // All tables occupied or reserved — calculate turnaround estimate
  const activeTables = Math.max(1, occupied);
  const estimatedWait = Math.max(10, Math.min(60, Math.round(avgDining / activeTables)));

  return {
    estimatedWaitMinutes: estimatedWait,
    calculationType: 'RULE_BASED',
    confidence: 'CURRENT_OPERATIONAL_ESTIMATE',
    reason: `Estimated turnover based on average dining duration (${avgDining} mins)`,
    isPrediction: false,
    disclaimer: 'This is a rule-based operational estimate, not an AI prediction.',
  };
}

/**
 * Format weekly hours into readable array.
 */
function formatWeeklyHours(hoursRows) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatted = [];

  for (let d = 0; d < 7; d++) {
    const row = hoursRows ? hoursRows.find((h) => Number(h.day_of_week) === d) : null;
    if (!row || row.is_closed) {
      formatted.push({ dayOfWeek: d, dayName: dayNames[d], isClosed: true, hours: 'Closed' });
    } else {
      formatted.push({
        dayOfWeek: d,
        dayName: dayNames[d],
        isClosed: false,
        openTime: row.open_time?.slice(0, 5),
        closeTime: row.close_time?.slice(0, 5),
        hours: `${row.open_time?.slice(0, 5)} - ${row.close_time?.slice(0, 5)}`,
      });
    }
  }

  return formatted;
}

/**
 * Discover restaurants with proximity, filters, search, and live table counts.
 */
async function getRestaurants(query) {
  const userLat = query.lat !== undefined ? Number(query.lat) : (query.latitude !== undefined ? Number(query.latitude) : null);
  const userLng = query.lng !== undefined ? Number(query.lng) : (query.longitude !== undefined ? Number(query.longitude) : null);
  const radius = query.radius ? Number(query.radius) : 5;
  const search = query.search ? query.search.trim().toLowerCase() : null;
  const area = query.area ? query.area.trim().toLowerCase() : null;
  const cuisine = query.cuisine ? query.cuisine.trim().toLowerCase() : null;
  const openNow = query.openNow === true || query.openNow === 'true' || query.openNow === '1';

  // 1. Fetch approved and active restaurants
  const [restaurants] = await pool.query(
    `SELECT 
       id, owner_id, name, slug, description, cuisine_type, 
       address, latitude, longitude, phone, cover_photo_url, 
       avg_dining_duration_mins, avg_cleaning_duration_mins, tax_rate
     FROM restaurants 
     WHERE approval_status = 'approved' AND is_active = 1`
  );

  if (restaurants.length === 0) {
    return { count: 0, restaurants: [] };
  }

  const restaurantIds = restaurants.map((r) => r.id);

  // 2. Fetch all operating hours for these restaurants
  const [hours] = await pool.query(
    `SELECT restaurant_id, day_of_week, open_time, close_time, is_closed 
     FROM restaurant_hours 
     WHERE restaurant_id IN (?)`,
    [restaurantIds]
  );

  // 3. Fetch all table counts grouped by restaurant and status
  const [tableStats] = await pool.query(
    `SELECT restaurant_id, status, COUNT(*) as count 
     FROM tables 
     WHERE restaurant_id IN (?) 
     GROUP BY restaurant_id, status`,
    [restaurantIds]
  );

  const hoursByRest = {};
  hours.forEach((h) => {
    if (!hoursByRest[h.restaurant_id]) hoursByRest[h.restaurant_id] = [];
    hoursByRest[h.restaurant_id].push(h);
  });

  const statsByRest = {};
  tableStats.forEach((t) => {
    if (!statsByRest[t.restaurant_id]) statsByRest[t.restaurant_id] = {};
    statsByRest[t.restaurant_id][t.status] = Number(t.count);
  });

  // 4. Transform and enrich each restaurant
  let results = restaurants.map((r) => {
    const restHours = hoursByRest[r.id] || [];
    const { isOpen, todayHours } = checkIsOpen(restHours);

    const stats = statsByRest[r.id] || {};
    const availableTables = stats.available || 0;
    const occupiedTables  = stats.occupied  || 0;
    const reservedTables  = stats.reserved  || 0;
    const cleaningTables  = stats.cleaning  || 0;
    const totalTables     = availableTables + occupiedTables + reservedTables + cleaningTables;

    const crowdLevel = calculateCrowdLevel(availableTables, occupiedTables, reservedTables, cleaningTables, totalTables);
    const waitInfo = calculateWaitTime(
      availableTables,
      occupiedTables,
      reservedTables,
      cleaningTables,
      totalTables,
      r.avg_dining_duration_mins,
      r.avg_cleaning_duration_mins
    );

    // Distance calculation
    let distanceKm = null;
    if (userLat !== null && userLng !== null && r.latitude !== null && r.longitude !== null) {
      const d = haversine(userLat, userLng, Number(r.latitude), Number(r.longitude));
      distanceKm = Math.round(d * 10) / 10;
    }

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      cuisineType: r.cuisine_type,
      address: r.address,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
      phone: r.phone,
      coverPhotoUrl: r.cover_photo_url,
      taxRate: Number(r.tax_rate),
      distanceKm,
      isOpen,
      todayHours,
      tableAvailability: {
        totalTables,
        availableTables,
        occupiedTables,
        reservedTables,
        cleaningTables,
      },
      crowdLevel,
      waitEstimation: waitInfo,
      estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
    };
  });

  // 5. Apply filters
  if (userLat !== null && userLng !== null) {
    results = results.filter((r) => r.distanceKm !== null && r.distanceKm <= radius);
  }

  if (search) {
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        (r.address && r.address.toLowerCase().includes(search)) ||
        (r.cuisineType && r.cuisineType.toLowerCase().includes(search)) ||
        (r.description && r.description.toLowerCase().includes(search))
    );
  }

  if (area) {
    results = results.filter((r) => r.address && r.address.toLowerCase().includes(area));
  }

  if (cuisine) {
    results = results.filter((r) => r.cuisineType && r.cuisineType.toLowerCase() === cuisine);
  }

  if (openNow) {
    results = results.filter((r) => r.isOpen);
  }

  // 6. Sort
  if (userLat !== null && userLng !== null) {
    results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    count: results.length,
    userLocation: userLat !== null && userLng !== null ? { latitude: userLat, longitude: userLng } : null,
    searchRadiusKm: radius,
    restaurants: results,
  };
}

/**
 * Get comprehensive restaurant details by ID or slug.
 */
async function getRestaurantById(idOrSlug, userLat = null, userLng = null) {
  const isNumeric = /^\d+$/.test(String(idOrSlug).trim());

  let query = 'SELECT * FROM restaurants WHERE ';
  let param = null;

  if (isNumeric) {
    query += 'id = ?';
    param = Number(idOrSlug);
  } else {
    query += 'slug = ?';
    param = String(idOrSlug).trim();
  }

  const [rows] = await pool.query(query, [param]);
  const restaurant = rows[0];

  if (!restaurant) {
    throw new AppError(404, 'NOT_FOUND', 'Restaurant not found');
  }

  if (restaurant.approval_status !== 'approved' || !restaurant.is_active) {
    throw new AppError(400, 'RESTAURANT_INACTIVE', 'This restaurant is currently not active on TablePulse');
  }

  // Fetch hours
  const [hours] = await pool.query(
    'SELECT day_of_week, open_time, close_time, is_closed FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week ASC',
    [restaurant.id]
  );
  const { isOpen, todayHours } = checkIsOpen(hours);
  const weeklyHours = formatWeeklyHours(hours);

  // Fetch tables (customer read-only view — exclude sensitive qr_token)
  const [tables] = await pool.query(
    `SELECT id, table_number, capacity, status, status_changed_at, occupied_since, display_order 
     FROM tables 
     WHERE restaurant_id = ? 
     ORDER BY display_order ASC, table_number ASC`,
    [restaurant.id]
  );

  const availableTables = tables.filter((t) => t.status === 'available').length;
  const occupiedTables  = tables.filter((t) => t.status === 'occupied').length;
  const reservedTables  = tables.filter((t) => t.status === 'reserved').length;
  const cleaningTables  = tables.filter((t) => t.status === 'cleaning').length;
  const totalTables     = tables.length;

  const crowdLevel = calculateCrowdLevel(availableTables, occupiedTables, reservedTables, cleaningTables, totalTables);
  const waitInfo = calculateWaitTime(
    availableTables,
    occupiedTables,
    reservedTables,
    cleaningTables,
    totalTables,
    restaurant.avg_dining_duration_mins,
    restaurant.avg_cleaning_duration_mins
  );

  // Distance calculation
  let distanceKm = null;
  if (userLat !== null && userLng !== null && restaurant.latitude && restaurant.longitude) {
    const d = haversine(Number(userLat), Number(userLng), Number(restaurant.latitude), Number(restaurant.longitude));
    distanceKm = Math.round(d * 10) / 10;
  }

  return {
    id: restaurant.id,
    ownerId: restaurant.owner_id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    cuisineType: restaurant.cuisine_type,
    address: restaurant.address,
    latitude: restaurant.latitude !== null ? Number(restaurant.latitude) : null,
    longitude: restaurant.longitude !== null ? Number(restaurant.longitude) : null,
    phone: restaurant.phone,
    coverPhotoUrl: restaurant.cover_photo_url,
    taxRate: Number(restaurant.tax_rate),
    distanceKm,
    isOpen,
    todayHours,
    weeklyHours,
    tableAvailability: {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      cleaningTables,
    },
    crowdLevel,
    waitEstimation: waitInfo,
    estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
    tables: tables.map((t) => ({
      id: t.id,
      tableNumber: t.table_number,
      capacity: Number(t.capacity),
      status: t.status,
      statusChangedAt: t.status_changed_at,
      occupiedSince: t.occupied_since,
      displayOrder: Number(t.display_order),
    })),
  };
}

/**
 * Update a table's status and broadcast real-time availability.
 */
async function updateTableStatus(restaurantId, tableId, newStatus) {
  const [tRows] = await pool.query(
    'SELECT id, restaurant_id, table_number, status FROM tables WHERE id = ? AND restaurant_id = ?',
    [tableId, restaurantId]
  );

  if (tRows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Table not found for this restaurant');
  }

  const currentTable = tRows[0];
  const occupiedSinceClause = newStatus === 'occupied' ? 'NOW()' : (newStatus === 'available' ? 'NULL' : 'occupied_since');

  await pool.query(
    `UPDATE tables 
     SET status = ?, 
         status_changed_at = NOW(), 
         occupied_since = ${occupiedSinceClause} 
     WHERE id = ? AND restaurant_id = ?`,
    [newStatus, tableId, restaurantId]
  );

  // Recalculate complete availability for the restaurant
  const details = await getRestaurantById(restaurantId);

  // Broadcast real-time event via Socket.IO
  try {
    const io = getIO();
    const payload = {
      restaurantId: Number(restaurantId),
      tableId: Number(tableId),
      tableNumber: currentTable.table_number,
      previousStatus: currentTable.status,
      newStatus,
      tableAvailability: details.tableAvailability,
      crowdLevel: details.crowdLevel,
      estimatedWaitMinutes: details.estimatedWaitMinutes,
      waitEstimation: details.waitEstimation,
      updatedAt: new Date().toISOString(),
    };

    io.to(`restaurant:${restaurantId}`).emit('restaurant:availability_updated', payload);
  } catch (err) {
    console.warn('[Socket] Real-time broadcast warning:', err.message);
  }

  return {
    table: {
      id: Number(tableId),
      tableNumber: currentTable.table_number,
      status: newStatus,
    },
    tableAvailability: details.tableAvailability,
    crowdLevel: details.crowdLevel,
    estimatedWaitMinutes: details.estimatedWaitMinutes,
  };
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  updateTableStatus,
  calculateCrowdLevel,
  calculateWaitTime,
  checkIsOpen,
};
