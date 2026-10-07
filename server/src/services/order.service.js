const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const socketEmitter = require('../socket/socket.emitter');

/**
 * Order Service
 * Handles customer order placement, order history, tracking,
 * and restaurant owner order management with real-time updates.
 */

// Helper to resolve owner's restaurant
async function getOwnerRestaurant(userId, role) {
  if (role === 'admin') return null;
  const [rows] = await pool.query(
    'SELECT id, name, is_active FROM restaurants WHERE owner_id = ? LIMIT 1',
    [userId]
  );
  if (!rows.length) {
    throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'No restaurant profile found for this owner account');
  }
  return rows[0];
}

/**
 * Place a new order from digital menu or QR scan
 */
async function createOrder(user, data) {
  let { restaurantId, tableId, items, specialNote } = data;

  // 1. Validate restaurant
  const [restRows] = await pool.query(
    'SELECT id, name, is_active, owner_id FROM restaurants WHERE id = ?',
    [restaurantId]
  );
  if (!restRows.length) {
    throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found');
  }
  if (!restRows[0].is_active) {
    throw new AppError(400, 'RESTAURANT_INACTIVE', 'This restaurant is currently not accepting orders');
  }

  // 2. Validate table or assign available table for pre-order
  if (!tableId) {
    const [availTables] = await pool.query(
      `SELECT id, table_number, status FROM tables 
       WHERE restaurant_id = ? 
       ORDER BY (status = 'available') DESC, display_order ASC, id ASC LIMIT 1`,
      [restaurantId]
    );
    if (!availTables.length) {
      throw new AppError(400, 'NO_TABLES', 'This restaurant has no tables registered for orders');
    }
    tableId = availTables[0].id;
  } else {
    const [tableRows] = await pool.query(
      'SELECT id, restaurant_id, table_number, status FROM tables WHERE id = ? AND restaurant_id = ?',
      [tableId, restaurantId]
    );
    if (!tableRows.length) {
      throw new AppError(404, 'TABLE_NOT_FOUND', 'The specified table does not exist at this restaurant');
    }
  }

  // 3. Validate items and availability
  const itemIds = items.map((i) => i.menuItemId);
  const [dbItems] = await pool.query(
    `SELECT id, restaurant_id, name, price, is_available
     FROM menu_items
     WHERE id IN (?) AND restaurant_id = ?`,
    [itemIds, restaurantId]
  );

  const dbItemMap = new Map();
  dbItems.forEach((item) => dbItemMap.set(item.id, item));

  // Check that all requested items exist and are available
  for (const reqItem of items) {
    const item = dbItemMap.get(reqItem.menuItemId);
    if (!item) {
      throw new AppError(400, 'ITEM_NOT_FOUND', `Menu item #${reqItem.menuItemId} is not available at this restaurant`);
    }
    if (!item.is_available) {
      throw new AppError(400, 'ITEM_UNAVAILABLE', `"${item.name}" is currently sold out`);
    }
  }

  // 4. Calculate prices
  let subtotal = 0;
  const processedItems = items.map((reqItem) => {
    const item = dbItemMap.get(reqItem.menuItemId);
    const unitPrice = parseFloat(item.price);
    const quantity = parseInt(reqItem.quantity, 10);
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;
    return {
      menuItemId: item.id,
      itemName: item.name,
      unitPrice,
      quantity,
      lineTotal,
    };
  });

  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = Math.round((subtotal + tax) * 100) / 100;

  // 5. Transaction to insert order and order_items
  const conn = await pool.getConnection();
  let orderId;

  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_id, restaurant_id, table_id, status, special_note)
       VALUES (?, ?, ?, 'received', ?)`,
      [user.userId, restaurantId, tableId, specialNote || null]
    );
    orderId = orderResult.insertId;

    for (const item of processedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.menuItemId, item.itemName, item.unitPrice, item.quantity]
      );
    }

    // Update table status to occupied if currently available or reserved
    await conn.query(
      `UPDATE tables
       SET status = 'occupied',
           status_changed_at = NOW(),
           occupied_since = COALESCE(occupied_since, NOW())
       WHERE id = ?`,
      [tableId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // 6. Fetch complete created order for return and socket emission
  const fullOrder = await getOrderById(user, orderId);

  // 7. Emit real-time socket events
  socketEmitter.emitOrderCreated(restaurantId, fullOrder);

  return fullOrder;
}

/**
 * Get customer orders list
 */
async function getCustomerOrders(userId) {
  const [orders] = await pool.query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.table_id, o.status,
            o.special_note, o.created_at, o.updated_at,
            r.name AS restaurant_name, r.cover_photo_url AS cover_image_url, r.address AS restaurant_address,
            t.table_number
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN tables t ON o.table_id = t.id
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  if (!orders.length) {
    return [];
  }

  const orderIds = orders.map((o) => o.id);
  const [items] = await pool.query(
    `SELECT id, order_id, menu_item_id, item_name, unit_price, quantity
     FROM order_items
     WHERE order_id IN (?)
     ORDER BY id ASC`,
    [orderIds]
  );

  const itemsByOrder = new Map();
  items.forEach((it) => {
    if (!itemsByOrder.has(it.order_id)) {
      itemsByOrder.set(it.order_id, []);
    }
    itemsByOrder.get(it.order_id).push({
      id: it.id,
      menuItemId: it.menu_item_id,
      name: it.item_name,
      unitPrice: parseFloat(it.unit_price),
      quantity: it.quantity,
      lineTotal: parseFloat((it.unit_price * it.quantity).toFixed(2)),
    });
  });

  return orders.map((o) => {
    const oItems = itemsByOrder.get(o.id) || [];
    const subtotal = oItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const itemCount = oItems.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      id: o.id,
      customerId: o.customer_id,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurant_name,
      restaurantAddress: o.restaurant_address,
      coverImageUrl: o.cover_image_url,
      tableId: o.table_id,
      tableNumber: o.table_number,
      status: o.status,
      specialNote: o.special_note,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      subtotal,
      tax,
      total,
      itemCount,
      items: oItems,
    };
  });
}

/**
 * Get detailed order by ID
 */
async function getOrderById(user, orderId) {
  const [orders] = await pool.query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.table_id, o.status,
            o.special_note, o.created_at, o.updated_at,
            r.name AS restaurant_name, r.owner_id, r.phone AS restaurant_phone,
            r.address AS restaurant_address, r.cover_photo_url AS cover_image_url,
            t.table_number, t.capacity AS table_capacity,
            u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN tables t ON o.table_id = t.id
     JOIN users u ON o.customer_id = u.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!orders.length) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  const o = orders[0];

  // Authorization check: Must be the customer, restaurant owner, or admin
  const isCustomer = user && Number(user.userId) === Number(o.customer_id);
  const isOwner = user && Number(user.userId) === Number(o.owner_id);
  const isAdmin = user && user.role === 'admin';

  if (user && !isCustomer && !isOwner && !isAdmin) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this order');
  }

  const [items] = await pool.query(
    `SELECT id, order_id, menu_item_id, item_name, unit_price, quantity
     FROM order_items
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId]
  );

  const formattedItems = items.map((it) => ({
    id: it.id,
    menuItemId: it.menu_item_id,
    name: it.item_name,
    unitPrice: parseFloat(it.unit_price),
    quantity: it.quantity,
    lineTotal: parseFloat((it.unit_price * it.quantity).toFixed(2)),
  }));

  const subtotal = formattedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    id: o.id,
    customerId: o.customer_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurant_name,
    restaurantPhone: o.restaurant_phone,
    restaurantAddress: o.restaurant_address,
    coverImageUrl: o.cover_image_url,
    tableId: o.table_id,
    tableNumber: o.table_number,
    status: o.status,
    specialNote: o.special_note,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    items: formattedItems,
    itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal,
    tax,
    total,
  };
}

/**
 * Customer cancel order (Only if status is 'received')
 */
async function cancelOrder(user, orderId) {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE id = ?',
    [orderId]
  );

  if (!orders.length) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  const order = orders[0];

  if (Number(order.customer_id) !== Number(user.userId) && user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'You can only cancel your own orders');
  }

  if (order.status !== 'received') {
    throw new AppError(
      400,
      'CANNOT_CANCEL_ORDER',
      `Cannot cancel order with status "${order.status}". Only orders that have not started preparation can be cancelled.`
    );
  }

  await pool.query(
    "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
    [orderId]
  );

  const updatedOrder = await getOrderById(user, orderId);
  socketEmitter.emitOrderStatusChanged(order.customer_id, order.restaurant_id, updatedOrder);

  return updatedOrder;
}

/**
 * Owner: Get orders for their restaurant with filtering and pagination
 */
async function getOwnerOrders(user, query = {}) {
  let restaurantId;
  if (user.role === 'admin' && query.restaurantId) {
    restaurantId = query.restaurantId;
  } else {
    const rest = await getOwnerRestaurant(user.userId, user.role);
    restaurantId = rest.id;
  }

  const { status, tableId, limit = 50, page = 1 } = query;
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const whereConditions = ['o.restaurant_id = ?'];
  const params = [restaurantId];

  if (status) {
    if (status.includes(',')) {
      const statuses = status.split(',').map((s) => s.trim());
      whereConditions.push(`o.status IN (?)`);
      params.push(statuses);
    } else {
      whereConditions.push('o.status = ?');
      params.push(status);
    }
  }

  if (tableId) {
    whereConditions.push('o.table_id = ?');
    params.push(tableId);
  }

  const whereClause = whereConditions.join(' AND ');

  const [orders] = await pool.query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.table_id, o.status,
            o.special_note, o.created_at, o.updated_at,
            t.table_number, t.capacity AS table_capacity,
            u.name AS customer_name, u.phone AS customer_phone
     FROM orders o
     JOIN tables t ON o.table_id = t.id
     JOIN users u ON o.customer_id = u.id
     WHERE ${whereClause}
     ORDER BY
       CASE o.status
         WHEN 'received' THEN 1
         WHEN 'preparing' THEN 2
         WHEN 'served' THEN 3
         WHEN 'completed' THEN 4
         WHEN 'cancelled' THEN 5
         ELSE 6
       END,
       o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit, 10), offset]
  );

  if (!orders.length) {
    return { orders: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }

  const orderIds = orders.map((o) => o.id);
  const [items] = await pool.query(
    `SELECT id, order_id, menu_item_id, item_name, unit_price, quantity
     FROM order_items
     WHERE order_id IN (?)
     ORDER BY id ASC`,
    [orderIds]
  );

  const itemsByOrder = new Map();
  items.forEach((it) => {
    if (!itemsByOrder.has(it.order_id)) {
      itemsByOrder.set(it.order_id, []);
    }
    itemsByOrder.get(it.order_id).push({
      id: it.id,
      menuItemId: it.menu_item_id,
      name: it.item_name,
      unitPrice: parseFloat(it.unit_price),
      quantity: it.quantity,
      lineTotal: parseFloat((it.unit_price * it.quantity).toFixed(2)),
    });
  });

  const formattedOrders = orders.map((o) => {
    const oItems = itemsByOrder.get(o.id) || [];
    const subtotal = oItems.reduce((acc, curr) => acc + curr.lineTotal, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return {
      id: o.id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      restaurantId: o.restaurant_id,
      tableId: o.table_id,
      tableNumber: o.table_number,
      tableCapacity: o.table_capacity,
      status: o.status,
      specialNote: o.special_note,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      items: oItems,
      itemCount: oItems.reduce((acc, curr) => acc + curr.quantity, 0),
      subtotal,
      tax,
      total,
    };
  });

  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o WHERE ${whereClause}`,
    params
  );

  return {
    orders: formattedOrders,
    total: countResult[0].total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
}

/**
 * Owner: Update order status
 */
async function updateOrderStatus(user, orderId, newStatus) {
  const [orders] = await pool.query(
    `SELECT o.*, r.owner_id
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!orders.length) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  const order = orders[0];

  if (user.role !== 'admin' && Number(order.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to manage orders for this restaurant');
  }

  // Check valid transition
  const current = order.status;
  if (current === newStatus) {
    return await getOrderById(user, orderId);
  }

  const validTransitions = {
    received: ['preparing', 'served', 'completed', 'cancelled'],
    preparing: ['served', 'completed', 'cancelled'],
    served: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[current]?.includes(newStatus)) {
    throw new AppError(
      400,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition order status from "${current}" to "${newStatus}"`
    );
  }

  await pool.query(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [newStatus, orderId]
  );

  // If order is completed or cancelled, free table if no other active orders remain on it
  if (['completed', 'cancelled'].includes(newStatus) && order.table_id) {
    try {
      const [activeOrders] = await pool.query(
        `SELECT id FROM orders WHERE table_id = ? AND status IN ('received', 'preparing', 'served') AND id != ?`,
        [order.table_id, orderId]
      );
      if (!activeOrders.length) {
        await pool.query(
          `UPDATE tables SET status = 'available', status_changed_at = NOW(), occupied_since = NULL WHERE id = ?`,
          [order.table_id]
        );
      }
    } catch (tblErr) {
      console.warn('[Table cleanup warn]:', tblErr.message);
    }
  }

  const updatedOrder = await getOrderById(user, orderId);
  socketEmitter.emitOrderStatusChanged(order.customer_id, order.restaurant_id, updatedOrder);

  return updatedOrder;
}

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder,
  getOwnerOrders,
  updateOrderStatus,
};
