const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const socketEmitter = require('../socket/socket.emitter');
const restaurantService = require('./restaurant.service');

/**
 * Resolves the authenticated owner's restaurant.
 * Guarantees that owners can ONLY access their own restaurant.
 */
async function getOwnerRestaurant(userId, role) {
  if (role === 'admin') {
    // For admin, fetch the first active restaurant or allow override
    const [rows] = await pool.query('SELECT * FROM restaurants ORDER BY id ASC LIMIT 1');
    if (!rows.length) {
      throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'No restaurants registered in the system');
    }
    return rows[0];
  }

  const [rows] = await pool.query(
    'SELECT * FROM restaurants WHERE owner_id = ? LIMIT 1',
    [userId]
  );

  if (!rows.length) {
    throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'No restaurant profile found for this owner account');
  }

  return rows[0];
}

/**
 * Validates that a resource belongs to the owner's restaurant.
 */
function assertOwnership(user, resourceRestaurantId) {
  if (user.role === 'admin') return;
  if (Number(user.restaurantId) !== Number(resourceRestaurantId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to manage this restaurant resource');
  }
}

/**
 * Get comprehensive, real-time dashboard data for the owner's restaurant.
 */
async function getDashboardStats(user) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  // 1. Fetch tables
  const [tables] = await pool.query(
    `SELECT id, table_number, capacity, status, status_changed_at, occupied_since, display_order 
     FROM tables 
     WHERE restaurant_id = ? 
     ORDER BY display_order ASC, table_number ASC`,
    [restaurantId]
  );

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount  = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount  = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount  = tables.filter((t) => t.status === 'cleaning').length;
  const totalTables    = tables.length;

  const occupancyRate = totalTables > 0
    ? Math.round(((occupiedCount + reservedCount + (cleaningCount * 0.5)) / totalTables) * 100)
    : 0;

  const crowdLevel = restaurantService.calculateCrowdLevel(
    availableCount,
    occupiedCount,
    reservedCount,
    cleaningCount,
    totalTables
  );

  const waitEstimation = restaurantService.calculateWaitTime(
    availableCount,
    occupiedCount,
    reservedCount,
    cleaningCount,
    totalTables,
    restaurant.avg_dining_duration_mins,
    restaurant.avg_cleaning_duration_mins
  );

  // 2. Query today's orders & revenue
  const [orderSummaryRows] = await pool.query(
    `SELECT 
       COUNT(*) AS total_today,
       COALESCE(SUM(CASE WHEN o.status IN ('received', 'preparing', 'served') THEN 1 ELSE 0 END), 0) AS active_today,
       COALESCE(SUM(CASE WHEN o.status = 'received' THEN 1 ELSE 0 END), 0) AS pending_today,
       COALESCE(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_today,
       COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_today,
       COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN oi_tot.order_total ELSE 0 END), 0) AS revenue_today
     FROM orders o
     LEFT JOIN (
       SELECT order_id, SUM(unit_price * quantity * 1.05) AS order_total
       FROM order_items
       GROUP BY order_id
     ) oi_tot ON oi_tot.order_id = o.id
     WHERE o.restaurant_id = ? AND DATE(o.created_at) = CURDATE()`,
    [restaurantId]
  );
  const orderSummary = orderSummaryRows[0] || {
    total_today: 0,
    active_today: 0,
    pending_today: 0,
    completed_today: 0,
    cancelled_today: 0,
    revenue_today: 0,
  };

  // Total all-time revenue
  const [allTimeRevenueRows] = await pool.query(
    `SELECT COALESCE(SUM(unit_price * quantity * 1.05), 0) AS total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND o.status != 'cancelled'`,
    [restaurantId]
  );
  const totalRevenue = Math.round(Number(allTimeRevenueRows[0]?.total_revenue || 0) * 100) / 100;

  // 3. Query today's reservations
  const [resSummaryRows] = await pool.query(
    `SELECT 
       COUNT(*) AS total_today,
       COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_today,
       COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed_today
     FROM reservations
     WHERE restaurant_id = ? AND reservation_date = CURDATE()`,
    [restaurantId]
  );
  const resSummary = resSummaryRows[0] || { total_today: 0, pending_today: 0, confirmed_today: 0 };

  // 4. Fetch recent orders (latest 6)
  const [recentOrdersRows] = await pool.query(
    `SELECT o.id, o.customer_id, o.table_id, o.status, o.created_at,
            t.table_number, u.name AS customer_name, u.phone AS customer_phone
     FROM orders o
     JOIN tables t ON o.table_id = t.id
     JOIN users u ON o.customer_id = u.id
     WHERE o.restaurant_id = ?
     ORDER BY o.created_at DESC
     LIMIT 6`,
    [restaurantId]
  );

  let recentOrders = [];
  if (recentOrdersRows.length > 0) {
    const orderIds = recentOrdersRows.map((o) => o.id);
    const [itemRows] = await pool.query(
      `SELECT order_id, item_name, unit_price, quantity 
       FROM order_items 
       WHERE order_id IN (?)`,
      [orderIds]
    );

    const itemsMap = new Map();
    itemRows.forEach((it) => {
      if (!itemsMap.has(it.order_id)) itemsMap.set(it.order_id, []);
      itemsMap.get(it.order_id).push(it);
    });

    recentOrders = recentOrdersRows.map((o) => {
      const items = itemsMap.get(o.id) || [];
      const subtotal = items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
      const total = Math.round(subtotal * 1.05 * 100) / 100;
      return {
        id: o.id,
        tableNumber: o.table_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        status: o.status,
        createdAt: o.created_at,
        total,
        itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
        items: items.map((i) => `${i.item_name} × ${i.quantity}`).slice(0, 3),
      };
    });
  }

  // 5. Fetch upcoming reservations for today
  const [recentResRows] = await pool.query(
    `SELECT r.id, r.party_size, r.reservation_date, r.reservation_time, r.status,
            u.name AS customer_name, u.phone AS customer_phone,
            t.table_number
     FROM reservations r
     JOIN users u ON r.customer_id = u.id
     LEFT JOIN tables t ON r.table_id = t.id
     WHERE r.restaurant_id = ? AND r.reservation_date = CURDATE()
     ORDER BY r.reservation_time ASC
     LIMIT 5`,
    [restaurantId]
  );

  // 6. Active diner tables mapping
  const occupiedTableIds = tables.filter((t) => t.status === 'occupied').map((t) => t.id);
  const activeOrdersMap = new Map();
  if (occupiedTableIds.length > 0) {
    const [activeOrders] = await pool.query(
      `SELECT o.id, o.table_id, o.status, o.created_at, u.name AS customer_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.table_id IN (?) AND o.status IN ('received', 'preparing', 'served')
       ORDER BY o.created_at DESC`,
      [occupiedTableIds]
    );
    activeOrders.forEach((ao) => {
      if (!activeOrdersMap.has(ao.table_id)) {
        activeOrdersMap.set(ao.table_id, ao);
      }
    });
  }

  const floorTables = tables.map((t) => ({
    id: t.id,
    tableNumber: t.table_number,
    capacity: Number(t.capacity),
    status: t.status,
    statusChangedAt: t.status_changed_at,
    occupiedSince: t.occupied_since,
    activeOrder: activeOrdersMap.get(t.id) || null,
  }));

  // 7. Check operating hours
  const [hours] = await pool.query(
    'SELECT day_of_week, open_time, close_time, is_closed FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week ASC',
    [restaurantId]
  );
  const { isOpen, todayHours } = restaurantService.checkIsOpen(hours);

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      cuisineType: restaurant.cuisine_type,
      address: restaurant.address,
      phone: restaurant.phone,
      coverPhotoUrl: restaurant.cover_photo_url,
      isActive: Boolean(restaurant.is_active),
      isOpen,
      todayHours,
      avgDiningMins: restaurant.avg_dining_duration_mins,
      avgCleaningMins: restaurant.avg_cleaning_duration_mins,
    },
    tables: {
      total: totalTables,
      available: availableCount,
      occupied: occupiedCount,
      reserved: reservedCount,
      cleaning: cleaningCount,
      occupancyRate,
      list: floorTables,
    },
    crowd: {
      level: crowdLevel,
      occupancyRate,
      estimatedWaitMinutes: waitEstimation.estimatedWaitMinutes,
      waitReason: waitEstimation.reason,
    },
    orders: {
      totalToday: Number(orderSummary.total_today),
      activeToday: Number(orderSummary.active_today),
      pendingToday: Number(orderSummary.pending_today),
      completedToday: Number(orderSummary.completed_today),
      cancelledToday: Number(orderSummary.cancelled_today),
      revenueToday: Math.round(Number(orderSummary.revenue_today) * 100) / 100,
      totalRevenue,
      recent: recentOrders,
    },
    reservations: {
      totalToday: Number(resSummary.total_today),
      pendingToday: Number(resSummary.pending_today),
      confirmedToday: Number(resSummary.confirmed_today),
      upcoming: recentResRows.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        partySize: r.party_size,
        reservationTime: String(r.reservation_time).slice(0, 5),
        status: r.status,
        tableNumber: r.table_number || 'Unassigned',
      })),
    },
  };
}

/**
 * Get detailed live table management view for owner's restaurant.
 * Includes active orders and active reservations per table.
 */
async function getOwnerTables(user) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  const [tables] = await pool.query(
    `SELECT id, restaurant_id, table_number, capacity, status, status_changed_at, occupied_since, display_order 
     FROM tables 
     WHERE restaurant_id = ? 
     ORDER BY display_order ASC, table_number ASC`,
    [restaurantId]
  );

  if (tables.length === 0) {
    return { restaurantId, tables: [], summary: { total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 } };
  }

  const tableIds = tables.map((t) => t.id);

  // Active orders attached to these tables
  const [activeOrders] = await pool.query(
    `SELECT o.id, o.table_id, o.status, o.special_note, o.created_at,
            u.name AS customer_name, u.phone AS customer_phone
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     WHERE o.table_id IN (?) AND o.status IN ('received', 'preparing', 'served')
     ORDER BY o.created_at DESC`,
    [tableIds]
  );

  const orderMap = new Map();
  if (activeOrders.length > 0) {
    const activeOrderIds = activeOrders.map((o) => o.id);
    const [items] = await pool.query(
      `SELECT order_id, item_name, unit_price, quantity 
       FROM order_items 
       WHERE order_id IN (?)`,
      [activeOrderIds]
    );

    const itemsByOrder = new Map();
    items.forEach((it) => {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
      itemsByOrder.get(it.order_id).push(it);
    });

    activeOrders.forEach((o) => {
      if (!orderMap.has(o.table_id)) {
        const oItems = itemsByOrder.get(o.id) || [];
        const subtotal = oItems.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
        const total = Math.round(subtotal * 1.05 * 100) / 100;
        orderMap.set(o.table_id, {
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          status: o.status,
          createdAt: o.created_at,
          total,
          itemCount: oItems.reduce((acc, curr) => acc + curr.quantity, 0),
          items: oItems.map((i) => ({ name: i.item_name, quantity: i.quantity, price: i.unit_price })),
        });
      }
    });
  }

  // Today's upcoming reservations attached to these tables
  const [upcomingRes] = await pool.query(
    `SELECT r.id, r.table_id, r.party_size, r.reservation_time, r.status,
            u.name AS customer_name, u.phone AS customer_phone
     FROM reservations r
     JOIN users u ON r.customer_id = u.id
     WHERE r.table_id IN (?) AND r.reservation_date = CURDATE() AND r.status IN ('pending', 'confirmed')
     ORDER BY r.reservation_time ASC`,
    [tableIds]
  );

  const resMap = new Map();
  upcomingRes.forEach((r) => {
    if (!resMap.has(r.table_id)) {
      resMap.set(r.table_id, {
        id: r.id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        partySize: r.party_size,
        reservationTime: String(r.reservation_time).slice(0, 5),
        status: r.status,
      });
    }
  });

  const enrichedTables = tables.map((t) => ({
    id: t.id,
    restaurantId: t.restaurant_id,
    tableNumber: t.table_number,
    capacity: Number(t.capacity),
    status: t.status,
    statusChangedAt: t.status_changed_at,
    occupiedSince: t.occupied_since,
    displayOrder: Number(t.display_order),
    activeOrder: orderMap.get(t.id) || null,
    activeReservation: resMap.get(t.id) || null,
  }));

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount  = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount  = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount  = tables.filter((t) => t.status === 'cleaning').length;

  return {
    restaurantId,
    restaurantName: restaurant.name,
    summary: {
      total: tables.length,
      available: availableCount,
      occupied: occupiedCount,
      reserved: reservedCount,
      cleaning: cleaningCount,
      crowdLevel: restaurantService.calculateCrowdLevel(availableCount, occupiedCount, reservedCount, cleaningCount, tables.length),
    },
    tables: enrichedTables,
  };
}

/**
 * Update table status for owner's restaurant with ownership verification.
 */
async function updateOwnerTableStatus(user, tableId, newStatus) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  // Check table belongs to this restaurant
  const [tRows] = await pool.query(
    'SELECT id, restaurant_id, table_number FROM tables WHERE id = ?',
    [tableId]
  );

  if (!tRows.length) {
    throw new AppError(404, 'NOT_FOUND', 'Table not found');
  }

  if (Number(tRows[0].restaurant_id) !== Number(restaurantId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to manage this table');
  }

  // Reuse existing operational calculation and broadcast from restaurantService
  return await restaurantService.updateTableStatus(restaurantId, tableId, newStatus);
}

/**
 * Get restaurant profile for logged-in owner.
 */
async function getOwnerRestaurantProfile(user) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  const [hours] = await pool.query(
    'SELECT day_of_week, open_time, close_time, is_closed FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week ASC',
    [restaurantId]
  );

  const weeklyHours = [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
    const row = hours.find((h) => Number(h.day_of_week) === dayIdx);
    return {
      dayOfWeek: dayIdx,
      openTime: row?.open_time ? String(row.open_time).slice(0, 5) : '11:00',
      closeTime: row?.close_time ? String(row.close_time).slice(0, 5) : '23:00',
      isClosed: Boolean(row?.is_closed),
    };
  });

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    cuisineType: restaurant.cuisine_type,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    phone: restaurant.phone,
    coverPhotoUrl: restaurant.cover_photo_url,
    avgDiningMins: restaurant.avg_dining_duration_mins,
    avgCleaningMins: restaurant.avg_cleaning_duration_mins,
    taxRate: Number(restaurant.tax_rate),
    approvalStatus: restaurant.approval_status,
    isActive: Boolean(restaurant.is_active),
    weeklyHours,
  };
}

/**
 * Update restaurant profile by owner (permitted fields only).
 */
async function updateOwnerRestaurantProfile(user, data) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  const allowedFields = [
    'name',
    'description',
    'cuisine_type',
    'address',
    'phone',
    'cover_photo_url',
    'avg_dining_duration_mins',
    'avg_cleaning_duration_mins',
    'is_active',
  ];

  const updates = [];
  const params = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name.trim());
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description ? data.description.trim() : null);
  }
  if (data.cuisineType !== undefined || data.cuisine_type !== undefined) {
    updates.push('cuisine_type = ?');
    params.push((data.cuisineType || data.cuisine_type).trim());
  }
  if (data.address !== undefined) {
    updates.push('address = ?');
    params.push(data.address.trim());
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    params.push(data.phone.trim());
  }
  if (data.coverPhotoUrl !== undefined || data.cover_photo_url !== undefined) {
    updates.push('cover_photo_url = ?');
    params.push((data.coverPhotoUrl || data.cover_photo_url).trim());
  }
  if (data.avgDiningMins !== undefined || data.avg_dining_duration_mins !== undefined) {
    updates.push('avg_dining_duration_mins = ?');
    params.push(Number(data.avgDiningMins || data.avg_dining_duration_mins));
  }
  if (data.avgCleaningMins !== undefined || data.avg_cleaning_duration_mins !== undefined) {
    updates.push('avg_cleaning_duration_mins = ?');
    params.push(Number(data.avgCleaningMins || data.avg_cleaning_duration_mins));
  }
  if (data.isActive !== undefined || data.is_active !== undefined) {
    const activeVal = data.isActive === true || data.is_active === 1 || data.isActive === 1 ? 1 : 0;
    updates.push('is_active = ?');
    params.push(activeVal);
  }

  if (updates.length > 0) {
    params.push(restaurantId);
    await pool.query(
      `UPDATE restaurants SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
  }

  // Handle operating hours update if provided
  if (Array.isArray(data.weeklyHours)) {
    for (const h of data.weeklyHours) {
      if (h.dayOfWeek !== undefined) {
        await pool.query(
          `INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             open_time = VALUES(open_time), 
             close_time = VALUES(close_time), 
             is_closed = VALUES(is_closed)`,
          [
            restaurantId,
            Number(h.dayOfWeek),
            h.openTime || '11:00:00',
            h.closeTime || '23:00:00',
            h.isClosed ? 1 : 0,
          ]
        );
      }
    }
  }

  // Notify connected clients that restaurant details updated
  socketEmitter.emitToRestaurant(restaurantId, 'restaurant:availability_updated', {
    restaurantId,
    timestamp: new Date().toISOString(),
  });

  return await getOwnerRestaurantProfile(user);
}

/**
 * Get distinct customers who interacted with the owner's restaurant.
 */
async function getOwnerCustomers(user) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  const [rows] = await pool.query(
    `SELECT 
       u.id, 
       u.name, 
       u.email, 
       u.phone,
       COUNT(DISTINCT o.id) AS total_orders,
       COALESCE(SUM(oi_total.order_total), 0) AS total_spent,
       COUNT(DISTINCT r.id) AS total_reservations,
       MAX(COALESCE(o.created_at, r.created_at)) AS last_visit
     FROM users u
     LEFT JOIN orders o ON o.customer_id = u.id AND o.restaurant_id = ?
     LEFT JOIN (
       SELECT order_id, SUM(unit_price * quantity * 1.05) AS order_total
       FROM order_items
       GROUP BY order_id
     ) oi_total ON oi_total.order_id = o.id
     LEFT JOIN reservations r ON r.customer_id = u.id AND r.restaurant_id = ?
     WHERE (o.id IS NOT NULL OR r.id IS NOT NULL)
     GROUP BY u.id, u.name, u.email, u.phone
     ORDER BY last_visit DESC
     LIMIT 100`,
    [restaurantId, restaurantId]
  );

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || 'N/A',
    totalOrders: Number(c.total_orders),
    totalSpent: Math.round(Number(c.total_spent) * 100) / 100,
    totalReservations: Number(c.total_reservations),
    lastVisit: c.last_visit,
  }));
}

/**
 * Get real analytics computed directly from the MySQL database.
 */
async function getOwnerAnalytics(user, timeframe = '7d') {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);
  const restaurantId = restaurant.id;

  const intervalDays = timeframe === '30d' ? 30 : (timeframe === '24h' ? 1 : 7);

  // 1. Total valid orders & revenue in interval
  const [totalRows] = await pool.query(
    `SELECT 
       COUNT(DISTINCT o.id) AS orders_count,
       COALESCE(SUM(oi.unit_price * oi.quantity * 1.05), 0) AS total_revenue
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.restaurant_id = ? 
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND o.status != 'cancelled'`,
    [restaurantId, intervalDays]
  );
  const totalOrders = Number(totalRows[0]?.orders_count || 0);
  const totalRevenue = Math.round(Number(totalRows[0]?.total_revenue || 0) * 100) / 100;
  const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // 2. Daily revenue & order trend
  const [trendRows] = await pool.query(
    `SELECT 
       DATE(o.created_at) AS date_str,
       COUNT(DISTINCT o.id) AS orders_count,
       COALESCE(SUM(oi.unit_price * oi.quantity * 1.05), 0) AS daily_revenue
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.restaurant_id = ? 
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND o.status != 'cancelled'
     GROUP BY DATE(o.created_at)
     ORDER BY date_str ASC`,
    [restaurantId, intervalDays]
  );

  const dailyTrend = trendRows.map((r) => ({
    date: r.date_str,
    orders: Number(r.orders_count),
    revenue: Math.round(Number(r.daily_revenue) * 100) / 100,
  }));

  // 3. Top 5 most ordered menu items
  const [topItemsRows] = await pool.query(
    `SELECT 
       oi.item_name, 
       SUM(oi.quantity) AS total_qty,
       SUM(oi.unit_price * oi.quantity) AS total_sales
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND o.status != 'cancelled'
     GROUP BY oi.item_name
     ORDER BY total_qty DESC
     LIMIT 5`,
    [restaurantId]
  );

  const topItems = topItemsRows.map((i) => ({
    name: i.item_name,
    quantity: Number(i.total_qty),
    sales: Math.round(Number(i.total_sales) * 100) / 100,
  }));

  // 4. Peak ordering hours
  const [peakHoursRows] = await pool.query(
    `SELECT HOUR(o.created_at) AS hour_of_day, COUNT(*) AS count
     FROM orders o
     WHERE o.restaurant_id = ? AND o.status != 'cancelled'
     GROUP BY HOUR(o.created_at)
     ORDER BY hour_of_day ASC`,
    [restaurantId]
  );

  const peakHours = peakHoursRows.map((h) => ({
    hour: Number(h.hour_of_day),
    label: `${Number(h.hour_of_day)}:00`,
    orders: Number(h.count),
  }));

  // 5. Reservation metrics
  const [resStatsRows] = await pool.query(
    `SELECT 
       COUNT(*) AS total_res,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_res,
       COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_res,
       COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed_res
     FROM reservations
     WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [restaurantId, intervalDays]
  );
  const resStats = resStatsRows[0] || { total_res: 0, completed_res: 0, cancelled_res: 0, confirmed_res: 0 };

  // 6. Current Table utilization
  const [tableCountRows] = await pool.query(
    `SELECT status, COUNT(*) as count 
     FROM tables 
     WHERE restaurant_id = ? 
     GROUP BY status`,
    [restaurantId]
  );
  const tableSummary = { available: 0, occupied: 0, reserved: 0, cleaning: 0, total: 0 };
  tableCountRows.forEach((r) => {
    tableSummary[r.status] = Number(r.count);
    tableSummary.total += Number(r.count);
  });
  const currentOccupancyPct = tableSummary.total > 0
    ? Math.round(((tableSummary.occupied + tableSummary.reserved) / tableSummary.total) * 100)
    : 0;

  return {
    timeframe,
    restaurantId,
    restaurantName: restaurant.name,
    kpis: {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      currentOccupancyPct,
      totalReservations: Number(resStats.total_res),
    },
    dailyTrend,
    topItems,
    peakHours,
    tableUtilization: {
      ...tableSummary,
      occupancyPercentage: currentOccupancyPct,
    },
    reservations: {
      total: Number(resStats.total_res),
      completed: Number(resStats.completed_res),
      cancelled: Number(resStats.cancelled_res),
      confirmed: Number(resStats.confirmed_res),
    },
  };
}

/**
 * Get notifications for owner.
 */
async function getOwnerNotifications(user) {
  const restaurant = await getOwnerRestaurant(user.userId, user.role);

  const [dbNotifications] = await pool.query(
    `SELECT id, user_id, title, message, type, reference_id, reference_type, is_read, created_at 
     FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 30`,
    [user.userId]
  );

  // If database notifications table has entries, return them
  if (dbNotifications.length > 0) {
    return dbNotifications;
  }

  // Synthesize recent activity stream from recent orders and reservations if notifications table is empty
  const [recentOrders] = await pool.query(
    `SELECT o.id, o.status, o.created_at, u.name AS customer_name, t.table_number
     FROM orders o
     JOIN users u ON o.customer_id = u.id
     JOIN tables t ON o.table_id = t.id
     WHERE o.restaurant_id = ?
     ORDER BY o.created_at DESC
     LIMIT 10`,
    [restaurant.id]
  );

  return recentOrders.map((o) => ({
    id: `ord-${o.id}`,
    userId: user.userId,
    title: `Order #${o.id} (${o.status.toUpperCase()})`,
    message: `${o.customer_name} placed an order at Table ${o.table_number}`,
    type: 'order',
    referenceId: o.id,
    referenceType: 'order',
    isRead: false,
    createdAt: o.created_at,
  }));
}

/**
 * Mark notification as read.
 */
async function markNotificationAsRead(user, notificationId) {
  if (typeof notificationId === 'number' || /^\d+$/.test(notificationId)) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, user.userId]
    );
  }
  return { success: true };
}

module.exports = {
  getOwnerRestaurant,
  assertOwnership,
  getDashboardStats,
  getOwnerTables,
  updateOwnerTableStatus,
  getOwnerRestaurantProfile,
  updateOwnerRestaurantProfile,
  getOwnerCustomers,
  getOwnerAnalytics,
  getOwnerNotifications,
  markNotificationAsRead,
};
