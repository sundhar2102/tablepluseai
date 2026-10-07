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

async function runBookingVerification() {
  console.log('============================================================');
  console.log('🧪 VERIFYING CUSTOMER BOOKING REAL-DATA FLOW & ISOLATION');
  console.log('============================================================\n');

  const rand = Date.now();
  const custAEmail = `cust_flow_a_${rand}@example.com`;
  const custBEmail = `cust_flow_b_${rand}@example.com`;
  const password = 'Password123!';

  // --- 1. SETUP CUSTOMER A ---
  console.log('--- TEST A: NEW CUSTOMER WITH ZERO BOOKINGS ---');
  const regARes = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: { name: 'Alice Customer', email: custAEmail, phone: '+91 9888877771', password, role: 'customer' }
  });
  assert(regARes.status === 201, 'Customer A registered');

  const loginARes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: custAEmail, password }
  });
  assert(loginARes.status === 200, 'Customer A logged in');
  const custAToken = loginARes.data.data.token;
  const custAId = loginARes.data.data.user.id;

  // Check /reservations and /reservations/my
  const aBookings1 = await request(`${API_BASE}/reservations`, {
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(aBookings1.status === 200, 'Customer A fetches reservations via GET /reservations');
  assert(Array.isArray(aBookings1.data.data) && aBookings1.data.data.length === 0, 'Customer A has ZERO bookings (empty array)');

  const aBookingsMy = await request(`${API_BASE}/reservations/my`, {
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(aBookingsMy.status === 200, 'Customer A fetches reservations via GET /reservations/my');
  assert(Array.isArray(aBookingsMy.data.data) && aBookingsMy.data.data.length === 0, 'GET /reservations/my also returns ZERO bookings');

  // Also check existing demo customer (user 8: customer@demo.com)
  const demoLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'customer@demo.com', password: 'Demo@1234' }
  });
  if (demoLogin.status === 200) {
    const demoToken = demoLogin.data.data.token;
    const demoBookings = await request(`${API_BASE}/reservations`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    assert(demoBookings.status === 200 && demoBookings.data.data.length === 0, 'customer@demo.com now has ZERO demo bookings');
  }

  // --- 2. CREATE REAL BOOKING AT RESTAURANT 1 ---
  console.log('\n--- TEST B: CREATE REAL BOOKING AT RESTAURANT 1 ---');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const dateStr = futureDate.toISOString().split('T')[0];

  const book1Res = await request(`${API_BASE}/reservations`, {
    method: 'POST',
    body: {
      restaurantId: 1,
      reservationDate: dateStr,
      reservationTime: '19:30',
      partySize: 2,
      specialNote: 'Real customer booking for anniversary',
    },
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(book1Res.status === 201, `Customer A created real reservation #${book1Res.data.data.id}`);
  const res1Id = book1Res.data.data.id;
  assert(book1Res.data.data.customerId === custAId, 'Reservation is strictly tied to Customer A ID');
  assert(book1Res.data.data.restaurantId === 1, 'Reservation belongs to Restaurant 1');

  // Customer A checks bookings now
  const aBookings2 = await request(`${API_BASE}/reservations`, {
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(aBookings2.data.data.length === 1, 'Customer A now sees EXACTLY 1 booking');
  assert(aBookings2.data.data[0].id === res1Id, `Booking #${res1Id} matches Customer A's real reservation`);

  // --- 3. CREATE REAL BOOKING AT RESTAURANT 2 ---
  console.log('\n--- TEST C: MULTI-RESTAURANT BOOKING FOR SAME CUSTOMER ---');
  const book2Res = await request(`${API_BASE}/reservations`, {
    method: 'POST',
    body: {
      restaurantId: 2,
      reservationDate: dateStr,
      reservationTime: '20:00',
      partySize: 4,
      specialNote: 'Seafood dinner booking',
    },
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(book2Res.status === 201, `Customer A created real reservation #${book2Res.data.data.id} at Restaurant 2`);
  const res2Id = book2Res.data.data.id;

  // Customer A checks bookings now
  const aBookings3 = await request(`${API_BASE}/reservations`, {
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(aBookings3.data.data.length === 2, 'Customer A sees BOTH of their real bookings (length: 2)');
  const foundR1 = aBookings3.data.data.some(r => r.id === res1Id && r.restaurantId === 1);
  const foundR2 = aBookings3.data.data.some(r => r.id === res2Id && r.restaurantId === 2);
  assert(foundR1 && foundR2, 'Customer A sees bookings across multiple restaurants correctly');

  // --- 4. CUSTOMER B ISOLATION & UNAUTHORIZED CANCEL ATTEMPT ---
  console.log('\n--- TEST D: SECOND CUSTOMER ISOLATION ---');
  const regBRes = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: { name: 'Bob Customer', email: custBEmail, phone: '+91 9888877772', password, role: 'customer' }
  });
  assert(regBRes.status === 201, 'Customer B registered');

  const loginBRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: custBEmail, password }
  });
  assert(loginBRes.status === 200, 'Customer B logged in');
  const custBToken = loginBRes.data.data.token;
  const custBId = loginBRes.data.data.user.id;

  // Customer B checks bookings
  const bBookings = await request(`${API_BASE}/reservations`, {
    headers: { Authorization: `Bearer ${custBToken}` }
  });
  assert(bBookings.data.data.length === 0, "Customer B sees ZERO bookings (cannot see Customer A's bookings)");

  // Customer B tries to view Customer A's reservation details
  const bViewA = await request(`${API_BASE}/reservations/${res1Id}`, {
    headers: { Authorization: `Bearer ${custBToken}` }
  });
  assert(bViewA.status === 403, 'Customer B is FORBIDDEN (403) from viewing Customer A reservation');

  // Customer B tries to cancel Customer A's reservation
  const bCancelA = await request(`${API_BASE}/reservations/${res1Id}/cancel`, {
    method: 'PATCH',
    body: { cancellationReason: 'Malicious attempt' },
    headers: { Authorization: `Bearer ${custBToken}` }
  });
  assert(bCancelA.status === 403, 'Customer B is FORBIDDEN (403) from cancelling Customer A reservation');

  // --- 5. OWNER DASHBOARD SCOPING ---
  console.log('\n--- TEST E: OWNER RESTAURANT SCOPING & CONFIRMATION ---');
  // Login Owner 1 (The Spice Pavilion)
  const o1Login = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'owner@demo.com', password: 'Demo@1234' }
  });
  assert(o1Login.status === 200, 'Owner 1 logged in');
  const o1Token = o1Login.data.data.token;

  const o1Reservations = await request(`${API_BASE}/owner/reservations`, {
    headers: { Authorization: `Bearer ${o1Token}` }
  });
  assert(o1Reservations.status === 200, 'Owner 1 fetches reservations');
  const o1List = o1Reservations.data.data.reservations || [];
  assert(o1List.some(r => r.id === res1Id), 'Owner 1 sees Customer A Restaurant 1 reservation');
  assert(!o1List.some(r => r.id === res2Id), 'Owner 1 CANNOT see Restaurant 2 reservation');

  // Login Owner 2 (Coastal Catch & Grills)
  const o2Login = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'owner2@demo.com', password: 'Demo@1234' }
  });
  assert(o2Login.status === 200, 'Owner 2 logged in');
  const o2Token = o2Login.data.data.token;

  const o2Reservations = await request(`${API_BASE}/owner/reservations`, {
    headers: { Authorization: `Bearer ${o2Token}` }
  });
  assert(o2Reservations.status === 200, 'Owner 2 fetches reservations');
  const o2List = o2Reservations.data.data.reservations || [];
  assert(o2List.some(r => r.id === res2Id), 'Owner 2 sees Customer A Restaurant 2 reservation');
  assert(!o2List.some(r => r.id === res1Id), 'Owner 2 CANNOT see Restaurant 1 reservation');

  // --- 6. CUSTOMER A CANCELS THEIR OWN RESERVATION ---
  console.log('\n--- TEST F: CUSTOMER CANCELLATION & CLEANUP ---');
  const cancelRes = await request(`${API_BASE}/reservations/${res1Id}/cancel`, {
    method: 'PATCH',
    body: { cancellationReason: 'Change of plans' },
    headers: { Authorization: `Bearer ${custAToken}` }
  });
  assert(cancelRes.status === 200, `Customer A successfully cancelled reservation #${res1Id}`);
  assert(cancelRes.data.data.status === 'cancelled', 'Reservation status updated to cancelled');

  // Cleanup test reservations to preserve clean database
  const { pool } = require('../server/src/config/db');
  await pool.query('DELETE FROM reservations WHERE id IN (?, ?)', [res1Id, res2Id]);
  await pool.query('DELETE FROM users WHERE id IN (?, ?)', [custAId, custBId]);
  console.log('  ✅ [PASS] Cleaned up temporary test records from MySQL');

  console.log('\n============================================================');
  console.log('🎉 ALL TESTS PASSED: REAL USER BOOKING DATA ONLY — VERIFIED');
  console.log('============================================================\n');
  process.exit(0);
}

runBookingVerification().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
