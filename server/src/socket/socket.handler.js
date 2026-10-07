const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Socket.IO server setup.
 * Attaches Socket.IO to the existing HTTP server.
 * Authenticates connections via JWT.
 */
function initSocket(httpServer) {
  const { Server } = require('socket.io');

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
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
    return process.env.NODE_ENV === 'development';
  };

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods:     ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Authentication middleware ─────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId       = decoded.userId;
      socket.userRole     = decoded.role;
      socket.restaurantId = decoded.restaurantId || null;
      next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    console.log(`[Socket] ✅ Connected: user ${socket.userId} (${socket.userRole})`);

    // Auto-join personal notification room
    socket.join(`user:${socket.userId}`);

    // Auto-join owner and restaurant room(s) if user is an owner or manager
    if (socket.userRole === 'owner' || socket.userRole === 'manager') {
      try {
        const [restRows] = await pool.query(
          'SELECT id FROM restaurants WHERE owner_id = ?',
          [socket.userId]
        );
        for (const rest of restRows) {
          socket.join(`owner:${rest.id}`);
          socket.join(`restaurant:${rest.id}`);
          console.log(`[Socket] 🏠 Owner ${socket.userId} joined owner:${rest.id} & restaurant:${rest.id}`);
        }
      } catch (err) {
        console.error('[Socket Error] Auto-joining owner rooms failed:', err.message);
      }
      if (socket.restaurantId) {
        socket.join(`owner:${socket.restaurantId}`);
        socket.join(`restaurant:${socket.restaurantId}`);
      }
    }

    // ── Client-emitted events ───────────────────────────────────────────────

    // Customer joins a restaurant room to receive live updates
    const handleJoinRestaurant = (restaurantId) => {
      const parsedId = typeof restaurantId === 'object' && restaurantId !== null ? restaurantId.restaurantId : restaurantId;
      if (parsedId) {
        socket.join(`restaurant:${parsedId}`);
        console.log(`[Socket] 📍 User ${socket.userId} joined restaurant:${parsedId}`);
      }
    };
    const handleLeaveRestaurant = (restaurantId) => {
      const parsedId = typeof restaurantId === 'object' && restaurantId !== null ? restaurantId.restaurantId : restaurantId;
      if (parsedId) {
        socket.leave(`restaurant:${parsedId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left restaurant:${parsedId}`);
      }
    };
    socket.on('join:restaurant', handleJoinRestaurant);
    socket.on('joinRestaurant', handleJoinRestaurant);
    socket.on('leave:restaurant', handleLeaveRestaurant);
    socket.on('leaveRestaurant', handleLeaveRestaurant);

    // Owner explicitly joins an owner dashboard room
    const handleJoinOwner = async (data) => {
      const targetRestId = typeof data === 'object' && data !== null ? data.restaurantId : data;
      const restId = targetRestId || socket.restaurantId;
      if (!restId) return;

      if (socket.userRole === 'admin') {
        socket.join(`owner:${restId}`);
        console.log(`[Socket] 👑 Admin joined owner:${restId}`);
        return;
      }

      if (socket.userRole === 'owner' || socket.userRole === 'manager') {
        try {
          const [rest] = await pool.query(
            'SELECT id FROM restaurants WHERE id = ? AND owner_id = ?',
            [restId, socket.userId]
          );
          if (rest.length) {
            socket.join(`owner:${restId}`);
            socket.join(`restaurant:${restId}`);
            console.log(`[Socket] 🏠 Owner ${socket.userId} joined owner:${restId} & restaurant:${restId}`);
          } else {
            console.warn(`[Socket Warn] User ${socket.userId} is not owner of restaurant ${restId}`);
          }
        } catch (err) {
          console.error('[Socket Error] handleJoinOwner error:', err.message);
        }
      }
    };
    socket.on('join:owner', handleJoinOwner);
    socket.on('joinOwner', handleJoinOwner);
    socket.on('owner:join', handleJoinOwner);

    // Table room infrastructure
    const handleJoinTable = (tableId) => {
      const parsedId = typeof tableId === 'object' && tableId !== null ? tableId.tableId : tableId;
      if (parsedId) {
        socket.join(`table:${parsedId}`);
        console.log(`[Socket] 🪑 User ${socket.userId} joined table:${parsedId}`);
      }
    };
    const handleLeaveTable = (tableId) => {
      const parsedId = typeof tableId === 'object' && tableId !== null ? tableId.tableId : tableId;
      if (parsedId) {
        socket.leave(`table:${parsedId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left table:${parsedId}`);
      }
    };
    socket.on('join:table', handleJoinTable);
    socket.on('joinTable', handleJoinTable);
    socket.on('leave:table', handleLeaveTable);
    socket.on('leaveTable', handleLeaveTable);

    // Order room infrastructure with security authorization check
    const handleJoinOrder = async (data) => {
      const orderId = typeof data === 'object' && data !== null ? data.orderId : data;
      if (!orderId) return;

      try {
        const [rows] = await pool.query(
          `SELECT o.id, o.customer_id, r.owner_id 
           FROM orders o 
           JOIN restaurants r ON o.restaurant_id = r.id 
           WHERE o.id = ?`,
          [orderId]
        );
        if (!rows.length) return;

        const order = rows[0];
        const isCustomer = Number(socket.userId) === Number(order.customer_id);
        const isOwner = Number(socket.userId) === Number(order.owner_id);
        const isAdmin = socket.userRole === 'admin';

        if (isCustomer || isOwner || isAdmin) {
          socket.join(`order:${orderId}`);
          console.log(`[Socket] 🧾 User ${socket.userId} authorized & joined order:${orderId}`);
        } else {
          console.warn(`[Socket Warn] User ${socket.userId} unauthorized to track order:${orderId}`);
        }
      } catch (err) {
        console.error('[Socket Error] handleJoinOrder error:', err.message);
      }
    };
    const handleLeaveOrder = (data) => {
      const orderId = typeof data === 'object' && data !== null ? data.orderId : data;
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left order:${orderId}`);
      }
    };
    socket.on('join:order', handleJoinOrder);
    socket.on('joinOrder', handleJoinOrder);
    socket.on('order:track', handleJoinOrder);
    socket.on('leave:order', handleLeaveOrder);
    socket.on('leaveOrder', handleLeaveOrder);

    // ── Connection test event (Stage 5 verification) ────────────────────────
    socket.on('ping:test', (data) => {
      socket.emit('pong:test', {
        received: data,
        userId:   socket.userId,
        role:     socket.userRole,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] ❌ Disconnected: user ${socket.userId} — ${reason}`);
    });
  });

  console.log('[Socket] ✅ Socket.IO server initialized');
  return io;
}

module.exports = { initSocket };
