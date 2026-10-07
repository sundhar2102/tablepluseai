const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config(); // fallback to current working directory
const http = require('http');
const app  = require('./src/app');
const { connectDB }   = require('./src/config/db');
const { initSocket }  = require('./src/socket/socket.handler');
const { setIO }       = require('./src/socket/socket.emitter');

const PORT = parseInt(process.env.PORT) || 3001;

async function start() {
  // 1. Verify database connection before starting the server
  await connectDB();

  // 2. Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // 3. Attach Socket.IO
  const io = initSocket(httpServer);
  setIO(io);

  // 4. Start listening
  const HOST = process.env.HOST || '0.0.0.0';
  httpServer.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        TABLEPULSE AI — SERVER            ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  HTTP   : http://localhost:${PORT}          ║`);
    console.log(`║  LAN    : http://0.0.0.0:${PORT}            ║`);
    console.log(`║  Health : http://localhost:${PORT}/api/health ║`);
    console.log(`║  Env    : ${process.env.NODE_ENV || 'development'}                    ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  // 5. Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down...');
    httpServer.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    console.log('\n[Server] SIGINT received. Shutting down...');
    httpServer.close(() => process.exit(0));
  });
}

start().catch((err) => {
  console.error('[Server] ❌ Failed to start:', err);
  process.exit(1);
});
