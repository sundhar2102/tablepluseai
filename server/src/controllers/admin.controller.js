const { pool } = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * GET /api/admin/users
 * List all users with optional role filtering
 */
const getAdminUsers = catchAsync(async (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, name, email, phone, role, is_active, created_at FROM users';
  const params = [];

  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY created_at DESC LIMIT 100';

  const [rows] = await pool.query(sql, params);
  sendSuccess(res, 200, { total: rows.length, users: rows }, 'Users retrieved successfully');
});

/**
 * GET /api/admin/restaurants
 * List all restaurants with approval and active status
 */
const getAdminRestaurants = catchAsync(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS owner_name, u.email AS owner_email 
     FROM restaurants r 
     LEFT JOIN users u ON r.owner_id = u.id 
     ORDER BY r.created_at DESC`
  );
  sendSuccess(res, 200, { total: rows.length, restaurants: rows }, 'Restaurants retrieved successfully');
});

/**
 * PATCH /api/admin/restaurants/:id/approval
 * Approve or reject restaurant registration
 */
const updateRestaurantApproval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, isActive } = req.body;

  const updates = [];
  const params = [];

  if (approvalStatus) {
    updates.push('approval_status = ?');
    params.push(approvalStatus);
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    throw new AppError(400, 'BAD_REQUEST', 'No valid fields provided for update');
  }

  params.push(Number(id));
  await pool.query(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [Number(id)]);
  if (!rows.length) {
    throw new AppError(404, 'NOT_FOUND', 'Restaurant not found');
  }

  sendSuccess(res, 200, rows[0], 'Restaurant approval updated successfully');
});

/**
 * GET /api/admin/stats
 * Platform-wide analytics
 */
const getAdminStats = catchAsync(async (req, res) => {
  const [userCount] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [restCount] = await pool.query('SELECT COUNT(*) AS count FROM restaurants WHERE is_active = 1');
  const [orderCount] = await pool.query('SELECT COUNT(*) AS count FROM orders');
  const [resCount] = await pool.query('SELECT COUNT(*) AS count FROM reservations');

  sendSuccess(res, 200, {
    totalUsers: userCount[0].count,
    activeRestaurants: restCount[0].count,
    totalOrders: orderCount[0].count,
    totalReservations: resCount[0].count
  }, 'Admin stats retrieved successfully');
});

module.exports = {
  getAdminUsers,
  getAdminRestaurants,
  updateRestaurantApproval,
  getAdminStats
};
