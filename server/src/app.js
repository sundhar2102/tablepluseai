require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { pool }          = require('./config/db');
const authRoutes        = require('./routes/auth.routes');
const restaurantRoutes  = require('./routes/restaurant.routes');
const { errorHandler }  = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
const corsOptions = {
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
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

// ── Stage 6 routes (placeholder — uncomment as implemented) ──────────────
// app.use('/api', tableRoutes);
// app.use('/api', reservationRoutes);
// app.use('/api', queueRoutes);
// app.use('/api', menuRoutes);
// app.use('/api', orderRoutes);
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
