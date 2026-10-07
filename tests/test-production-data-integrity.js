const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runIntegrityAuditTests() {
  console.log('============================================================');
  console.log('🧪 MASTER PRODUCTION DATA INTEGRITY & ISOLATION AUDIT');
  console.log('============================================================\n');

  const rand = Date.now();
  const custAlphaEmail = `alpha_prod_${rand}@example.com`;
  const custBetaEmail = `beta_prod_${rand}@example.com`;
  const password = 'Password123!';

  // --- 1. VERIFY DEMO CUSTOMER (USER 8: customer@demo.com) HAS ZERO ORDERS & BOOKINGS ---
  console.log('--- 1. VERIFY customer@demo.com HAS ZERO UNWANTED LEAKED DATA ---');
  const demoLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'customer@demo.com', password: 'Demo@1234' }
  });
  assert(demoLogin.status === 200, 'customer@demo.com authenticated');
  const demoToken = demoLogin.data.data.token;

  const demoOrders = await request(`${API_BASE}/orders/my`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  assert(demoOrders.status === 200, 'customer@demo.com fetches orders');
  assert(Array.isArray(demoOrders.data.data) && demoOrders.data.data.length === 0, 'customer@demo.com has EXACTLY 0 orders in DB');

  const demoReservations = await request(`${API_BASE}/reservations/my`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  assert(demoReservations.status === 200, 'customer@demo.com fetches reservations');
  assert(Array.isArray(demoReservations.data.data), 'customer@demo.com reservations is array');
  assert(demoReservations.data.data.every(r => (r.customerId === 8 || r.customer_id === 8)), 'All customer@demo.com reservations strictly belong to customer 8 (no cross-customer leakage)');

  // --- 2. FRESH CUSTOMER ALPHA REGISTRATION & ZERO ACTIVITY STATE ---
  console.log('\n--- 2. FRESH CUSTOMER ALPHA REGISTRATION & ZERO ACTIVITY STATE ---');
  const regAlpha = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: { name: 'Alpha Customer', email: custAlphaEmail, phone: '+91 9999988881', password, role: 'customer' }
  });
  assert(regAlpha.status === 201, 'Customer Alpha registered');

  const loginAlpha = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: custAlphaEmail, password }
  });
  assert(loginAlpha.status === 200, 'Customer Alpha logged in');
  const alphaToken = loginAlpha.data.data.token;
  const alphaId = loginAlpha.data.data.user.id;

  const alphaOrders1 = await request(`${API_BASE}/orders/my`, {
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(alphaOrders1.data.data.length === 0, 'Customer Alpha initially sees EXACTLY 0 orders');

  const alphaRes1 = await request(`${API_BASE}/reservations/my`, {
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(alphaRes1.data.data.length === 0, 'Customer Alpha initially sees EXACTLY 0 bookings');

  // --- 3. CUSTOMER ALPHA CREATES EXACTLY ONE REAL ORDER ---
  console.log('\n--- 3. CUSTOMER ALPHA CREATES EXACTLY ONE REAL ORDER ---');
  const createOrderRes = await request(`${API_BASE}/orders`, {
    method: 'POST',
    body: {
      restaurantId: 1,
      tableId: 1,
      items: [{ menuItemId: 1, quantity: 2 }],
      specialNote: 'Real customer order for table 1'
    },
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(createOrderRes.status === 201, `Customer Alpha created real order #${createOrderRes.data.data.id}`);
  const alphaOrderId = createOrderRes.data.data.id;

  const alphaOrders2 = await request(`${API_BASE}/orders/my`, {
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(alphaOrders2.data.data.length === 1, 'Customer Alpha now sees EXACTLY 1 order');
  assert(alphaOrders2.data.data[0].id === alphaOrderId, `Order ID matches #${alphaOrderId}`);

  // --- 4. CUSTOMER ALPHA CREATES EXACTLY ONE REAL BOOKING ---
  console.log('\n--- 4. CUSTOMER ALPHA CREATES EXACTLY ONE REAL BOOKING ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const dateStr = futureDate.toISOString().split('T')[0];

  const createResRes = await request(`${API_BASE}/reservations`, {
    method: 'POST',
    body: {
      restaurantId: 1,
      reservationDate: dateStr,
      reservationTime: '20:00',
      partySize: 2,
      specialNote: 'Real anniversary dinner'
    },
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(createResRes.status === 201, `Customer Alpha created real reservation #${createResRes.data.data.id}`);
  const alphaResId = createResRes.data.data.id;

  const alphaRes2 = await request(`${API_BASE}/reservations/my`, {
    headers: { Authorization: `Bearer ${alphaToken}` }
  });
  assert(alphaRes2.data.data.length === 1, 'Customer Alpha now sees EXACTLY 1 booking');
  assert(alphaRes2.data.data[0].id === alphaResId, `Reservation ID matches #${alphaResId}`);

  // --- 5. FRESH CUSTOMER BETA (DATA ISOLATION) ---
  console.log('\n--- 5. FRESH CUSTOMER BETA REGISTRATION & ZERO ACTIVITY (ISOLATION) ---');
  const regBeta = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: { name: 'Beta Customer', email: custBetaEmail, phone: '+91 9999988882', password, role: 'customer' }
  });
  assert(regBeta.status === 201, 'Customer Beta registered');

  const loginBeta = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: custBetaEmail, password }
  });
  assert(loginBeta.status === 200, 'Customer Beta logged in');
  const betaToken = loginBeta.data.data.token;
  const betaId = loginBeta.data.data.user.id;

  const betaOrders = await request(`${API_BASE}/orders/my`, {
    headers: { Authorization: `Bearer ${betaToken}` }
  });
  assert(betaOrders.data.data.length === 0, "Customer Beta sees ZERO orders (cannot see Customer Alpha's order)");

  const betaRes = await request(`${API_BASE}/reservations/my`, {
    headers: { Authorization: `Bearer ${betaToken}` }
  });
  assert(betaRes.data.data.length === 0, "Customer Beta sees ZERO bookings (cannot see Customer Alpha's booking)");

  // Unauthorized access checks
  const betaViewOrder = await request(`${API_BASE}/orders/${alphaOrderId}`, {
    headers: { Authorization: `Bearer ${betaToken}` }
  });
  assert(betaViewOrder.status === 403, 'Customer Beta is FORBIDDEN (403) from accessing Customer Alpha order');

  const betaViewRes = await request(`${API_BASE}/reservations/${alphaResId}`, {
    headers: { Authorization: `Bearer ${betaToken}` }
  });
  assert(betaViewRes.status === 403, 'Customer Beta is FORBIDDEN (403) from accessing Customer Alpha reservation');

  // --- 6. OWNER SCOPING (RESTAURANT 1 vs RESTAURANT 2) ---
  console.log('\n--- 6. OWNER RESTAURANT SCOPING & VERIFICATION ---');
  const o1Login = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'owner@demo.com', password: 'Demo@1234' }
  });
  assert(o1Login.status === 200, 'Owner 1 logged in');
  const o1Token = o1Login.data.data.token;

  const o1Orders = await request(`${API_BASE}/owner/orders`, {
    headers: { Authorization: `Bearer ${o1Token}` }
  });
  assert(o1Orders.data.data.some(o => o.id === alphaOrderId), 'Owner 1 sees Alpha Restaurant 1 order');

  const o1Reservations = await request(`${API_BASE}/owner/reservations`, {
    headers: { Authorization: `Bearer ${o1Token}` }
  });
  assert(o1Reservations.data.data.reservations.some(r => r.id === alphaResId), 'Owner 1 sees Alpha Restaurant 1 booking');

  // Owner 2 (Coastal Catch & Grills)
  const o2Login = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'owner2@demo.com', password: 'Demo@1234' }
  });
  assert(o2Login.status === 200, 'Owner 2 logged in');
  const o2Token = o2Login.data.data.token;

  const o2Orders = await request(`${API_BASE}/owner/orders`, {
    headers: { Authorization: `Bearer ${o2Token}` }
  });
  assert(!o2Orders.data.data.some(o => o.id === alphaOrderId), 'Owner 2 CANNOT see Restaurant 1 order (Strict isolation)');

  const o2Reservations = await request(`${API_BASE}/owner/reservations`, {
    headers: { Authorization: `Bearer ${o2Token}` }
  });
  assert(!o2Reservations.data.data.reservations.some(r => r.id === alphaResId), 'Owner 2 CANNOT see Restaurant 1 booking (Strict isolation)');

  // --- 7. CLEAN TEARDOWN ---
  console.log('\n--- 7. CLEAN TEARDOWN OF TEST DATA ---');
  const { pool } = require('../server/src/config/db');
  await pool.query('DELETE FROM order_items WHERE order_id = ?', [alphaOrderId]);
  await pool.query('DELETE FROM orders WHERE id = ?', [alphaOrderId]);
  await pool.query('DELETE FROM reservations WHERE id = ?', [alphaResId]);
  await pool.query('DELETE FROM users WHERE id IN (?, ?)', [alphaId, betaId]);
  console.log('  ✅ [PASS] Cleaned up temporary test order, reservation, and users from MySQL');

  console.log('\n============================================================');
  console.log('🎉 MASTER DATA INTEGRITY & ISOLATION AUDIT FULLY PASSED');
  console.log('============================================================\n');
  process.exit(0);
}

runIntegrityAuditTests().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
