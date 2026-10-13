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
app.use(helmet({
  crossOriginResourcePolicy: false
}));

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
    return callback(null, false);
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
  let databaseConnected = false;
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
    databaseConnected = true;
  } catch {
    dbStatus = 'disconnected';
    databaseConnected = false;
  }

  res.json({
    success:           true,
    service:           'Smart Table AI API',
    databaseConnected: databaseConnected,
    status:            'ok',
    environment:       process.env.NODE_ENV || 'development',
    timestamp:         new Date().toISOString(),
    database:          dbStatus,
    version:           '1.0.0',
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

// ── Mobile App Download Routes ───────────────────────────────────────────
const fs = require('fs');
const apkFilePath = path.resolve(__dirname, '../../smart-table-ai.apk');

app.get('/download/app', (req, res) => {
  if (!fs.existsSync(apkFilePath)) {
    return res.status(404).send('APK file not found on server.');
  }
  res.download(apkFilePath, 'smart-table-ai.apk', (err) => {
    if (err && !res.headersSent) {
      res.status(500).send('Error downloading APK.');
    }
  });
});

app.get('/download', (req, res) => {
  const host = req.get('host') || '10.157.15.46:3001';
  const downloadUrl = `${req.protocol}://${host}/download/app`;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download Smart Table AI Mobile App</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
        .card { background: #1e293b; border-radius: 16px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { margin: 0 0 8px 0; font-size: 24px; color: #38bdf8; }
        p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .btn { display: inline-block; width: 100%; box-sizing: border-box; background: #0284c7; color: white; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 600; font-size: 16px; transition: background 0.2s; margin-top: 16px; }
        .btn:hover { background: #0369a1; }
        .badge { background: #0369a1; color: #e0f2fe; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; display: inline-block; margin-bottom: 16px; }
        .qr-box { background: white; padding: 12px; border-radius: 12px; display: inline-block; margin: 12px auto; }
        .info { margin-top: 16px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Android APK (Direct Install)</div>
        <h1>Smart Table AI</h1>
        <p>Real-time restaurant table booking, queue & dining assistant</p>
        
        <div class="qr-box">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(downloadUrl)}" alt="Scan to download" width="180" height="180" />
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #cbd5e1;">Scan QR code or click below to install</p>

        <a class="btn" href="/download/app" download>📥 Download Android APK (4.3 MB)</a>

        <div class="info">
          Direct Link: <br><code style="color: #38bdf8; word-break: break-all;">${downloadUrl}</code>
        </div>
      </div>
    </body>
    </html>
  `);
});

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
