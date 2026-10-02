const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const { pool }   = require('../config/db');
const AppError   = require('../utils/AppError');

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user (customer or owner).
 * Hashes the password before storing.
 */
async function register({ name, email, phone, password, role }) {
  // Check for existing email
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (rows.length > 0) {
    throw new AppError(409, 'DUPLICATE_ERROR', 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [result] = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || null, passwordHash, role || 'customer']
  );

  return { userId: result.insertId, name, email, role: role || 'customer' };
}

/**
 * Login — verify credentials and return a JWT.
 */
async function login({ email, password, role }) {
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
    [email]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  // If a role is specified in the request, verify it matches
  if (role && user.role !== role) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  if (!user.is_active) {
    throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact support.');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  // Fetch restaurantId for owners
  let restaurantId = null;
  if (user.role === 'owner') {
    const [restRows] = await pool.query(
      'SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1',
      [user.id]
    );
    restaurantId = restRows[0]?.id || null;
  }

  // Generate JWT
  const payload = {
    userId: user.id,
    role:   user.role,
    ...(restaurantId && { restaurantId }),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '24h',
  });

  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  };
}

/**
 * Get user profile by ID (no password_hash returned).
 */
async function getUserById(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found.');
  return rows[0];
}

/**
 * Update user profile (name, phone).
 */
async function updateProfile(userId, { name, phone }) {
  await pool.query(
    'UPDATE users SET name = ?, phone = ? WHERE id = ?',
    [name, phone || null, userId]
  );
  return getUserById(userId);
}

/**
 * Change password — verifies current password before updating.
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const [rows] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found.');

  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.query(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [newHash, userId]
  );
}

module.exports = { register, login, getUserById, updateProfile, changePassword };
