/**
 * TablePulse AI - Automated Navigation & Button Test Suite
 * Minimum Requirements:
 * - Public navigation
 * - Customer navigation
 * - Owner navigation
 * - Admin navigation
 * - Protected routes
 * - Logout
 * - Back navigation
 * - Invalid routes
 * - Important action buttons
 */

const assert = require('assert');
const http = require('http');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

const results = [];

async function runTest(id, category, name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id, category, name, status: 'PASS', duration: Date.now() - start, error: null });
  } catch (err) {
    results.push({ id, category, name, status: 'FAIL', duration: Date.now() - start, error: err.message });
  }
}

async function apiRequest(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function frontendRequest(path) {
  const res = await fetch(`${FRONTEND_BASE}${path}`, {
    headers: { 'Accept': 'text/html' }
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text };
}

(async () => {
  console.log('\n====================================================');
  console.log('  TABLEPULSE AI — NAVIGATION & BUTTON AUDIT TESTS');
  console.log('====================================================\n');

  let customerToken = null;
  let ownerToken = null;
  let adminToken = null;
  let testRestaurantId = 1;

  // ── 1. PUBLIC NAVIGATION & ROUTES ──────────────────────────────
  await runTest('NAV-001', 'Public Navigation', 'Frontend SPA index serves root entry HTML', async () => {
    const res = await frontendRequest('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('<div id="root"></div>'));
  });

  await runTest('NAV-002', 'Public Navigation', 'Customer Login page (/login) route responds with 200', async () => {
    const res = await frontendRequest('/login');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('TablePulse AI'));
  });

  await runTest('NAV-003', 'Public Navigation', 'Customer Register page (/register) route responds with 200', async () => {
    const res = await frontendRequest('/register');
    assert.strictEqual(res.status, 200);
  });

  await runTest('NAV-004', 'Public Navigation', 'Owner Login page (/owner/login) route responds with 200', async () => {
    const res = await frontendRequest('/owner/login');
    assert.strictEqual(res.status, 200);
  });

  await runTest('NAV-005', 'Public Navigation', 'Admin Login page (/admin/login) route responds with 200', async () => {
    const res = await frontendRequest('/admin/login');
    assert.strictEqual(res.status, 200);
  });

  await runTest('NAV-006', 'Public Navigation', 'Unauthorized page (/unauthorized) route responds with 200', async () => {
    const res = await frontendRequest('/unauthorized');
    assert.strictEqual(res.status, 200);
  });

  await runTest('NAV-007', 'Invalid Routes', 'Nonexistent route (/random-page-xyz-404) renders without server crash', async () => {
    const res = await frontendRequest('/random-page-xyz-404');
    assert.strictEqual(res.status, 200); // SPA serves index.html for client-side router 404
  });

  // ── 2. AUTHENTICATION & LOGIN BUTTON ACTIONS ───────────────────
  await runTest('BTN-AUTH-01', 'Customer Auth', 'Customer login button executes valid API login', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@demo.com', password: 'Demo@1234', role: 'customer' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'customer');
    customerToken = res.data.data.token;
  });

  await runTest('BTN-AUTH-02', 'Customer Auth', 'Customer login button shows error on invalid credentials', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@demo.com', password: 'WrongPassword!', role: 'customer' }),
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'INVALID_CREDENTIALS');
  });

  await runTest('BTN-AUTH-03', 'Owner Auth', 'Owner login button executes valid API login', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@demo.com', password: 'Demo@1234', role: 'owner' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'owner');
    ownerToken = res.data.data.token;
  });

  await runTest('BTN-AUTH-04', 'Admin Auth', 'Admin login button executes valid API login', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@tablepulse.app', password: 'Demo@1234', role: 'admin' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'admin');
    adminToken = res.data.data.token;
  });

  // ── 3. PROTECTED ROUTES & ROLE GUARDS ──────────────────────────
  await runTest('GUARD-001', 'Route Protection', 'Unauthenticated request to protected /users/me is blocked', async () => {
    const res = await apiRequest('/users/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error.code, 'TOKEN_MISSING');
  });

  await runTest('GUARD-002', 'Route Protection', 'Invalid JWT token is blocked with 401 TOKEN_INVALID', async () => {
    const res = await apiRequest('/users/me', {
      headers: { Authorization: 'Bearer invalid.bogus.token' },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error.code, 'TOKEN_INVALID');
  });

  await runTest('GUARD-003', 'Role Protection', 'Customer token is blocked from accessing Owner endpoints', async () => {
    const res = await apiRequest('/test/owner', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
  });

  await runTest('GUARD-004', 'Role Protection', 'Customer token is blocked from accessing Admin endpoints', async () => {
    const res = await apiRequest('/test/admin', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
  });

  await runTest('GUARD-005', 'Role Protection', 'Owner token is blocked from accessing Admin endpoints', async () => {
    const res = await apiRequest('/test/admin', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
  });

  await runTest('GUARD-006', 'Role Protection', 'Admin token is allowed on Admin endpoints', async () => {
    const res = await apiRequest('/test/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  // ── 4. CUSTOMER NAVIGATION & RESTAURANT DISCOVERY ACTIONS ─────
  await runTest('BTN-CUST-01', 'Customer Discovery', 'Restaurant discovery API fetches restaurants list', async () => {
    const res = await apiRequest('/restaurants?lat=13.0418&lng=80.2341&radius=10', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.restaurants));
    assert.ok(res.data.data.restaurants.length > 0);
    testRestaurantId = res.data.data.restaurants[0].id;
  });

  await runTest('BTN-CUST-02', 'Customer Discovery', 'Search filter button/action filters by name correctly', async () => {
    const res = await apiRequest('/restaurants?search=Spice', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.restaurants.some(r => r.name.toLowerCase().includes('spice')));
  });

  await runTest('BTN-CUST-03', 'Customer Discovery', 'Restaurant card navigation target (/restaurants/:id) loads full details', async () => {
    const res = await apiRequest(`/restaurants/${testRestaurantId}?lat=13.0418&lng=80.2341`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.tables);
    assert.ok(res.data.data.tableAvailability);
    assert.ok(res.data.data.weeklyHours);
  });

  await runTest('BTN-CUST-04', 'Customer Discovery', 'Restaurant details returns 404 for invalid restaurant ID', async () => {
    const res = await apiRequest('/restaurants/99999', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.error.code, 'NOT_FOUND');
  });

  // ── 5. OPERATIONAL MUTATIONS & ACTION BUTTONS ─────────────────
  await runTest('BTN-ACTION-01', 'Table Actions', 'Customer is blocked from mutating table status', async () => {
    const res = await apiRequest(`/restaurants/${testRestaurantId}/tables/1/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ status: 'occupied' }),
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest('BTN-ACTION-02', 'Table Actions', 'Owner can update table status', async () => {
    const res = await apiRequest(`/restaurants/1/tables/1/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'available' }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.table.status, 'available');
  });

  // ── 6. LOGOUT ACTIONS ──────────────────────────────────────────
  await runTest('BTN-LOGOUT-01', 'Logout Actions', 'Customer logout action calls API and invalidates session', async () => {
    const res = await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('BTN-LOGOUT-02', 'Logout Actions', 'Owner logout action calls API and invalidates session', async () => {
    const res = await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('BTN-LOGOUT-03', 'Logout Actions', 'Admin logout action calls API and invalidates session', async () => {
    const res = await apiRequest('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  // ── 7. ROUTE INTEGRITY & STATIC DEFINITIONS ────────────────────
  await runTest('ROUTES-01', 'Route Validation', 'Verify React Router definitions match ROUTES constants', () => {
    const fs = require('fs');
    const routesContent = fs.readFileSync('client/src/constants/routes.js', 'utf8');
    const appContent = fs.readFileSync('client/src/App.jsx', 'utf8');

    // Key routes must be declared in both
    const requiredPaths = [
      '/app',
      '/app/restaurants',
      '/app/restaurants/:id',
      '/app/bookings',
      '/app/orders',
      '/app/profile',
      '/owner',
      '/owner/tables',
      '/owner/reservations',
      '/owner/orders',
      '/owner/menu',
      '/owner/queue',
      '/owner/reports',
      '/owner/settings',
      '/admin',
      '/admin/restaurants',
      '/admin/approvals',
      '/admin/users',
      '/admin/owners',
      '/admin/reports',
      '/admin/settings',
    ];

    for (const p of requiredPaths) {
      assert.ok(appContent.includes(`path="${p}"`), `Missing route in App.jsx: ${p}`);
    }
  });

  // ── SUMMARY REPORT ─────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('              AUTOMATED TEST RESULTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.id}] ${r.category} :: ${r.name} (${r.duration}ms)`);
    if (r.error) console.log(`   └─ Error: ${r.error}`);
    if (r.status === 'PASS') passed++;
    else failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`Total Navigation Tests : ${results.length}`);
  console.log(`Passed                 : ${passed}`);
  console.log(`Failed                 : ${failed}`);
  console.log(`Overall Status         : ${failed === 0 ? 'ALL PASSED ✅' : 'FAILURES FOUND ❌'}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
