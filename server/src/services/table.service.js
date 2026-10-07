const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Table Service
 * Handles QR token resolution and table status querying.
 */

async function getTableByQrToken(qrToken) {
  if (!qrToken || typeof qrToken !== 'string') {
    throw new AppError(400, 'INVALID_QR_TOKEN', 'QR token is required');
  }

  const [rows] = await pool.query(
    `SELECT t.id AS table_id, t.restaurant_id, t.table_number, t.capacity,
            t.status AS table_status, t.qr_token,
            r.name AS restaurant_name, r.slug AS restaurant_slug,
            r.address AS restaurant_address, r.phone AS restaurant_phone,
            r.is_active AS restaurant_active, r.cover_photo_url AS cover_image_url
     FROM tables t
     JOIN restaurants r ON t.restaurant_id = r.id
     WHERE t.qr_token = ?`,
    [qrToken.trim()]
  );

  if (!rows.length) {
    throw new AppError(404, 'QR_NOT_FOUND', 'Table not found for the provided QR code');
  }

  const row = rows[0];
  return {
    table: {
      id: row.table_id,
      restaurantId: row.restaurant_id,
      tableNumber: row.table_number,
      capacity: row.capacity,
      status: row.table_status,
      qrToken: row.qr_token,
    },
    restaurant: {
      id: row.restaurant_id,
      name: row.restaurant_name,
      slug: row.restaurant_slug,
      address: row.restaurant_address,
      phone: row.restaurant_phone,
      isActive: Boolean(row.restaurant_active),
      coverImageUrl: row.cover_image_url,
    },
  };
}

async function getRestaurantTables(restaurantId) {
  const [tables] = await pool.query(
    `SELECT id, restaurant_id, table_number, capacity, status, qr_token, display_order
     FROM tables
     WHERE restaurant_id = ?
     ORDER BY display_order ASC, table_number ASC`,
    [restaurantId]
  );
  return tables;
}

async function getTableById(tableId) {
  const [rows] = await pool.query(
    `SELECT t.*, r.name AS restaurant_name, r.owner_id
     FROM tables t
     JOIN restaurants r ON t.restaurant_id = r.id
     WHERE t.id = ?`,
    [tableId]
  );

  if (!rows.length) {
    throw new AppError(404, 'TABLE_NOT_FOUND', 'Table not found');
  }

  return rows[0];
}

module.exports = {
  getTableByQrToken,
  getRestaurantTables,
  getTableById,
};
