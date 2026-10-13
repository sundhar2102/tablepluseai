const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config(); // fallback
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || 'tablepulse_db',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

/**
 * Test the database connection on startup.
 */
async function connectDB() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] ✅ MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('[DB] ❌ MySQL connection failed:', err.message);
    console.error('[DB] ⚠️ Server will continue to run, but database features will fail until MySQL is available.');
  }
}

module.exports = { pool, connectDB };
