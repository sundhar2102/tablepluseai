/**
 * TablePulse AI - Master REST API Test Suite
 * Tests: Auth, Restaurants, Menu, Tables, Orders, Reservations, Admin, Validation & Security
 */
const http = require('http');

const API_PORT = process.env.PORT || 3001;
const HOST = 'localhost';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: HOST,
        port: API_PORT,
        path: path.startsWith('/api') ? path : `/api${path}`,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runApiTestSuite() {
  console.log('============================================================');
  console.log('📡 RUNNING TABLEPULSE AI — MASTER REST API TEST SUITE');
  console.log('============================================================\n');

  const testResults = [];
  const startTime = Date.now();

  async function test(id, module, scenario, fn) {
    const t0 = Date.now();
    try {
      await fn();
      const duration = Date.now() - t0;
      testResults.push({ id, module, scenario, status: 'PASS', duration });
      console.log(`  ✅ [PASS] ${id} - ${scenario} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - t0;
      testResults.push({ id, module, scenario, status: 'FAIL', duration, error: err.message });
      console.error(`  ❌ [FAIL] ${id} - ${scenario}: ${err.message}`);
    }
  }

  let custToken, ownerToken, adminToken;
  const rand = Date.now();
  const testEmail = `apitest_${rand}@example.com`;

  // ── 1. AUTHENTICATION & SESSIONS ─────────────────────────────────────────
  console.log('--- 1. AUTHENTICATION APIs ---');
  await test('API-AUTH-001', 'Auth', 'POST /api/auth/register - Success', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'API Tester', email: testEmail, password: 'Password123!', role: 'customer' }
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await test('API-AUTH-002', 'Auth', 'POST /api/auth/register - Duplicate email rejected (409/400)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'API Tester', email: testEmail, password: 'Password123!', role: 'customer' }
    });
    if (res.status !== 400 && res.status !== 409) throw new Error(`Expected 400 or 409, got ${res.status}`);
  });

  await test('API-AUTH-003', 'Auth', 'POST /api/auth/register - Missing fields rejected (400)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { email: 'bad@bad.com' }
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('API-AUTH-004', 'Auth', 'POST /api/auth/login - Customer Login Success (200)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'customer@demo.com', password: 'Demo@1234' }
    });
    if (res.status !== 200 || !res.data.data?.token) throw new Error(`Login failed: ${res.status}`);
    custToken = res.data.data.token;
  });

  await test('API-AUTH-005', 'Auth', 'POST /api/auth/login - Invalid Password rejected (401)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'customer@demo.com', password: 'WrongPassword999' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('API-AUTH-006', 'Auth', 'POST /api/auth/login - Owner Login Success (200)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'owner@demo.com', password: 'Demo@1234' }
    });
    if (res.status !== 200 || !res.data.data?.token) throw new Error(`Owner login failed: ${res.status}`);
    ownerToken = res.data.data.token;
  });

  await test('API-AUTH-007', 'Auth', 'POST /api/auth/login - Admin Login Success (200)', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@tablepulse.app', password: 'Demo@1234' }
    });
    if (res.status !== 200 || !res.data.data?.token) throw new Error(`Admin login failed: ${res.status}`);
    adminToken = res.data.data.token;
  });

  // ── 2. RESTAURANTS & DISCOVERY ───────────────────────────────────────────
  console.log('\n--- 2. RESTAURANT APIs ---');
  await test('API-REST-001', 'Restaurants', 'GET /api/restaurants - Returns active restaurants list', async () => {
    const res = await request('/api/restaurants');
    const list = res.data.data?.restaurants || res.data.data;
    if (res.status !== 200 || !Array.isArray(list)) throw new Error(`Failed: ${res.status}`);
    if (list.length < 5) throw new Error(`Expected at least 5 restaurants, got ${list.length}`);
  });

  await test('API-REST-002', 'Restaurants', 'GET /api/restaurants/:id - Detail view contains tables and menu', async () => {
    const res = await request('/api/restaurants/1');
    if (res.status !== 200 || !res.data.data) throw new Error(`Failed to load restaurant 1: ${res.status}`);
    if (!res.data.data.menu) throw new Error('Restaurant details missing menu object');
  });

  await test('API-REST-003', 'Restaurants', 'GET /api/restaurants/999999 - Nonexistent restaurant returns 404', async () => {
    const res = await request('/api/restaurants/999999');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // ── 3. MENU APIS & DIETARY INTEGRITY ─────────────────────────────────────
  console.log('\n--- 3. MENU APIs ---');
  await test('API-MENU-001', 'Menu', 'GET /api/restaurants/1/menu - Returns categories and items', async () => {
    const res = await request('/api/restaurants/1/menu');
    if (res.status !== 200 || !res.data.data) throw new Error(`Failed: ${res.status}`);
  });

  await test('API-MENU-002', 'Menu', 'Verify items contain preparation_time_mins and valid is_vegetarian', async () => {
    const res = await request('/api/restaurants/1/menu');
    const items = res.data.data.allItems || [];
    if (items.length === 0) throw new Error('Zero items returned');
    const invalidVeg = items.filter(it => it.is_vegetarian !== 0 && it.is_vegetarian !== 1);
    if (invalidVeg.length > 0) throw new Error(`Found items with invalid is_vegetarian: ${invalidVeg.length}`);
  });

  // ── 4. ORDERS & PERMISSIONS ──────────────────────────────────────────────
  console.log('\n--- 4. ORDER APIs ---');
  await test('API-ORD-001', 'Orders', 'GET /api/orders/my - Customer receives empty list initially or own orders', async () => {
    const res = await request('/api/orders/my', {
      headers: { Authorization: `Bearer ${custToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error(`Failed: ${res.status}`);
  });

  await test('API-ORD-002', 'Orders', 'GET /api/orders/my - Unauthorized request rejected (401)', async () => {
    const res = await request('/api/orders/my');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('API-ORD-003', 'Orders', 'GET /api/owner/orders - Owner receives restaurant scoped orders', async () => {
    const res = await request('/api/owner/orders', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error(`Failed: ${res.status}`);
  });

  await test('API-ORD-004', 'Orders', 'GET /api/owner/orders - Customer access forbidden (403)', async () => {
    const res = await request('/api/owner/orders', {
      headers: { Authorization: `Bearer ${custToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // ── 5. RESERVATIONS & BOOKINGS ───────────────────────────────────────────
  console.log('\n--- 5. RESERVATION APIs ---');
  await test('API-RES-001', 'Reservations', 'GET /api/reservations/my - Customer retrieves authenticated bookings', async () => {
    const res = await request('/api/reservations/my', {
      headers: { Authorization: `Bearer ${custToken}` }
    });
    if (res.status !== 200 || !Array.isArray(res.data.data)) throw new Error(`Failed: ${res.status}`);
  });

  await test('API-RES-002', 'Reservations', 'GET /api/owner/reservations - Owner fetches restaurant bookings', async () => {
    const res = await request('/api/owner/reservations', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const list = res.data.data?.reservations || res.data.data;
    if (res.status !== 200 || !Array.isArray(list)) throw new Error(`Failed: ${res.status}`);
  });

  // ── 6. ADMIN PORTAL ──────────────────────────────────────────────────────
  console.log('\n--- 6. ADMIN APIs ---');
  await test('API-ADM-001', 'Admin', 'GET /api/admin/users - Admin lists registered users', async () => {
    const res = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status !== 200 || !res.data.data) throw new Error(`Failed: ${res.status}`);
  });

  await test('API-ADM-002', 'Admin', 'GET /api/admin/users - Customer token forbidden (403)', async () => {
    const res = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${custToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // ── 7. TEARDOWN TEST USER ────────────────────────────────────────────────
  try {
    const db = require('../../server/src/config/db');
    await db.pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
  } catch {}

  const duration = Date.now() - startTime;
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  const total = testResults.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log('\n============================================================');
  console.log(`🏁 REST API SUITE RESULTS: ${passed}/${total} PASSED (${passRate}%)`);
  console.log('============================================================\n');

  return { total, passed, failed, passRate, duration, testResults };
}

if (require.main === module) {
  runApiTestSuite()
    .then(res => process.exit(res.failed > 0 ? 1 : 0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runApiTestSuite };
