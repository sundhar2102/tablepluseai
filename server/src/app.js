const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // fallback
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { pool }          = require('./config/db');
const authRoutes        = require('./routes/auth.routes');
const restaurantRoutes  = require('./routes/restaurant.routes');
const reservationRoutes = require('./routes/reservation.routes');
const queueRoutes       = require('./routes/queue.routes');
const tableRoutes       = require('./routes/table.routes');
const menuRoutes        = require('./routes/menu.routes');
const orderRoutes       = require('./routes/order.routes');
const aiRoutes          = require('./routes/ai.routes');
const ownerRoutes       = require('./routes/owner.routes');
const adminRoutes       = require('./routes/admin.routes');
const { errorHandler }  = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'http://10.0.2.2:3001',
  'http://10.0.2.2',
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Native mobile apps, Capacitor, curl
  if (allowedOrigins.includes(origin)) return true;
  // Allow all RFC 1918 private LAN IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return process.env.NODE_ENV === 'development';
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ── JSON body parser ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logger (dev only to avoid noise in production) ───────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── General rate limiter ──────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    success:     true,
    status:      'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    database:    dbStatus,
    version:     '1.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', reservationRoutes);
app.use('/api', queueRoutes);
app.use('/api', tableRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', aiRoutes);
app.use('/api', ownerRoutes);
app.use('/api', adminRoutes);

// ── Stage 6 future routes (uncomment as implemented) ──────────────────────
// app.use('/api', paymentRoutes);
// app.use('/api', notificationRoutes);
// app.use('/api', adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
