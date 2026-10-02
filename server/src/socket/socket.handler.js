const jwt = require('jsonwebtoken');

/**
 * Socket.IO server setup.
 * Attaches Socket.IO to the existing HTTP server.
 * Authenticates connections via JWT.
 */
function initSocket(httpServer) {
  const { Server } = require('socket.io');

  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
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
  io.on('connection', (socket) => {
    console.log(`[Socket] ✅ Connected: user ${socket.userId} (${socket.userRole})`);

    // Auto-join personal notification room
    socket.join(`user:${socket.userId}`);

    // Auto-join owner room if user is an owner
    if (socket.userRole === 'owner' && socket.restaurantId) {
      socket.join(`owner:${socket.restaurantId}`);
      console.log(`[Socket] 🏠 Owner ${socket.userId} joined owner:${socket.restaurantId}`);
    }

    // ── Client-emitted events ───────────────────────────────────────────────

    // Customer joins a restaurant room to receive live updates
    const handleJoinRestaurant = (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        console.log(`[Socket] 📍 User ${socket.userId} joined restaurant:${restaurantId}`);
      }
    };
    const handleLeaveRestaurant = (restaurantId) => {
      if (restaurantId) {
        socket.leave(`restaurant:${restaurantId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left restaurant:${restaurantId}`);
      }
    };
    socket.on('join:restaurant', handleJoinRestaurant);
    socket.on('joinRestaurant', handleJoinRestaurant);
    socket.on('leave:restaurant', handleLeaveRestaurant);
    socket.on('leaveRestaurant', handleLeaveRestaurant);

    // Table room infrastructure (Stage 5 technical foundation)
    const handleJoinTable = (tableId) => {
      if (tableId) {
        socket.join(`table:${tableId}`);
        console.log(`[Socket] 🪑 User ${socket.userId} joined table:${tableId}`);
      }
    };
    const handleLeaveTable = (tableId) => {
      if (tableId) {
        socket.leave(`table:${tableId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left table:${tableId}`);
      }
    };
    socket.on('join:table', handleJoinTable);
    socket.on('joinTable', handleJoinTable);
    socket.on('leave:table', handleLeaveTable);
    socket.on('leaveTable', handleLeaveTable);

    // Order room infrastructure (Stage 5 technical foundation)
    const handleJoinOrder = (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`[Socket] 🧾 User ${socket.userId} joined order:${orderId}`);
      }
    };
    const handleLeaveOrder = (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`[Socket] 🚪 User ${socket.userId} left order:${orderId}`);
      }
    };
    socket.on('join:order', handleJoinOrder);
    socket.on('joinOrder', handleJoinOrder);
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
