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
  const HOST = '0.0.0.0';
  httpServer.listen(PORT, HOST, () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let lanIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // Prefer 192.168.x.x, 10.x.x.x, or 172.x.x.x
          lanIp = iface.address;
          if (lanIp.startsWith('192.168.') || lanIp.startsWith('10.')) {
            break;
          }
        }
      }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║               SMART TABLE AI — SERVER                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Status    : ONLINE & LISTENING                          ║`);
    console.log(`║  Port      : ${PORT}                                        ║`);
    console.log(`║  Binding   : 0.0.0.0 (All Interfaces)                    ║`);
    console.log(`║  Local URL : http://localhost:${PORT}                      ║`);
    console.log(`║  LAN URL   : http://${lanIp}:${PORT}               ║`);
    console.log(`║  API Base  : http://${lanIp}:${PORT}/api                   ║`);
    console.log(`║  Health    : http://${lanIp}:${PORT}/api/health            ║`);
    console.log(`║  Env       : ${process.env.NODE_ENV || 'development'}                             ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
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
// Trigger restart
