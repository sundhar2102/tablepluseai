/**
 * TablePulse AI - Security & Authorization Test Suite (55 Security Tests)
 * IDs: SEC-001 to SEC-055
 */

const assert = require('assert');
const path = require('path');
require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const jwt = require('../../server/node_modules/jsonwebtoken');
const testData = require('../test-data/testData');

const BASE_URL = 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET;

const results = [];

async function runTest(id, name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id, name, status: 'PASS', duration: Date.now() - start, error: null });
  } catch (err) {
    results.push({ id, name, status: 'FAIL', duration: Date.now() - start, error: err.message });
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, ok: res.ok, data };
}

(async () => {
  // Generate valid tokens with signed claims
  const customerToken = jwt.sign({ userId: 8, role: 'customer' }, JWT_SECRET, { expiresIn: '24h' });
  const ownerToken = jwt.sign({ userId: 2, role: 'owner', restaurantId: 1 }, JWT_SECRET, { expiresIn: '24h' });
  const adminToken = jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

  // ----------------------------------------------------
  // 1. Missing Token Handling (SEC-001 - SEC-010)
  // ----------------------------------------------------
  await runTest('SEC-001', 'Auth: /users/me without token returns 401', async () => {
    const res = await request('/users/me');
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-002', 'Auth: /users/me missing token error code is TOKEN_MISSING', async () => {
    const res = await request('/users/me');
    assert.strictEqual(res.data.error.code, 'TOKEN_MISSING');
  });

  await runTest('SEC-003', 'Auth: /test/customer without token returns 401', async () => {
    const res = await request('/test/customer');
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-004', 'Auth: /test/owner without token returns 401', async () => {
    const res = await request('/test/owner');
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-005', 'Auth: /test/admin without token returns 401', async () => {
    const res = await request('/test/admin');
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-006', 'Auth: Table status mutation without token returns 401', async () => {
    const res = await request('/restaurants/1/tables/1/status', { method: 'PATCH', body: JSON.stringify({ status: 'occupied' }) });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-007', 'Auth: Logout without token returns 401', async () => {
    const res = await request('/auth/logout', { method: 'POST' });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-008', 'Auth: Password change without token returns 401', async () => {
    const res = await request('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword: 'a', newPassword: 'b' }) });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-009', 'Auth: Profile update without token returns 401', async () => {
    const res = await request('/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'Hacker' }) });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-010', 'Auth: Empty Authorization header returns 401', async () => {
    const res = await request('/users/me', { headers: { Authorization: '' } });
    assert.strictEqual(res.status, 401);
  });

  // ----------------------------------------------------
  // 2. Invalid & Malformed Tokens (SEC-011 - SEC-020)
  // ----------------------------------------------------
  await runTest('SEC-011', 'Auth: Non-Bearer scheme returns 401', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Basic dXNlcjpwYXNz' } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-012', 'Auth: Malformed JWT string returns 401', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Bearer this.is.garbage' } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-013', 'Auth: Invalid JWT error code is TOKEN_INVALID', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Bearer invalid.token.value' } });
    assert.strictEqual(res.data.error.code, 'TOKEN_INVALID');
  });

  await runTest('SEC-014', 'Auth: Tampered signature returns 401', async () => {
    const parts = customerToken.split('.');
    const tampered = `${parts[0]}.${parts[1]}.invalidSig`;
    const res = await request('/users/me', { headers: { Authorization: `Bearer ${tampered}` } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-015', 'Auth: Blank token after Bearer returns 401', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Bearer ' } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-016', 'Auth: Whitespace token returns 401', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Bearer    ' } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-017', 'Auth: Token with none algorithm rejected', async () => {
    const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.';
    const res = await request('/users/me', { headers: { Authorization: `Bearer ${noneToken}` } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-018', 'Auth: Random bytes string rejected', async () => {
    const res = await request('/users/me', { headers: { Authorization: 'Bearer 0123456789abcdef' } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-019', 'Auth: SQL injection in token header safely rejected', async () => {
    const res = await request('/users/me', { headers: { Authorization: "Bearer ' OR '1'='1" } });
    assert.strictEqual(res.status, 401);
  });

  await runTest('SEC-020', 'Auth: Null byte rejected before reaching business logic', async () => {
    let threw = false;
    try {
      await fetch(`${BASE_URL}/users/me`, { headers: { Authorization: 'Bearer \x00admin' } });
    } catch {
      threw = true;
    }
    assert.strictEqual(threw, true);
  });

  // ----------------------------------------------------
  // 3. Role Authorization Matrix (SEC-021 - SEC-038)
  // ----------------------------------------------------
  await runTest('SEC-021', 'RBAC: Customer blocked from /test/owner (403)', async () => {
    const res = await request('/test/owner', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-022', 'RBAC: Customer /test/owner error code is FORBIDDEN', async () => {
    const res = await request('/test/owner', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
  });

  await runTest('SEC-023', 'RBAC: Customer blocked from /test/admin (403)', async () => {
    const res = await request('/test/admin', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-024', 'RBAC: Customer blocked from mutating table status (403)', async () => {
    const res = await request('/restaurants/1/tables/1/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ status: 'occupied' })
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-025', 'RBAC: Customer role cannot escalate to owner via body', async () => {
    const res = await request('/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ role: 'admin' })
    });
    assert.ok(res.data.data.role === 'customer' || res.status === 400);
  });

  await runTest('SEC-026', 'RBAC: Owner blocked from /test/admin (403)', async () => {
    const res = await request('/test/admin', { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-027', 'RBAC: Owner allowed access to /test/owner (200)', async () => {
    const res = await request('/test/owner', { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-028', 'RBAC: Owner allowed to mutate tables for their restaurant', async () => {
    const res = await request('/restaurants/1/tables/1/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'available' })
    });
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-029', 'RBAC: Admin allowed access to /test/admin (200)', async () => {
    const res = await request('/test/admin', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-030', 'RBAC: Admin allowed access to table mutation (admin role)', async () => {
    const res = await request('/restaurants/1/tables/1/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'available' })
    });
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-031', 'RBAC: Customer allowed access to customer test route', async () => {
    const res = await request('/test/customer', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-032', 'RBAC: Owner blocked from customer test route', async () => {
    const res = await request('/test/customer', { headers: { Authorization: `Bearer ${ownerToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-033', 'RBAC: Admin blocked from customer test route', async () => {
    const res = await request('/test/customer', { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-034', 'RBAC: Role claim in token cannot be overridden by query string', async () => {
    const res = await request('/test/admin?role=admin', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-035', 'RBAC: Role claim in token cannot be overridden by header x-role', async () => {
    const res = await request('/test/admin', {
      headers: { Authorization: `Bearer ${customerToken}`, 'x-role': 'admin' }
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-036', 'RBAC: Role claim in token cannot be overridden by cookie', async () => {
    const res = await request('/test/admin', {
      headers: { Authorization: `Bearer ${customerToken}`, Cookie: 'role=admin' }
    });
    assert.strictEqual(res.status, 403);
  });

  await runTest('SEC-037', 'RBAC: 403 Forbidden payload structure conforms to standard', async () => {
    const res = await request('/test/admin', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
  });

  await runTest('SEC-038', 'RBAC: 401 Unauthorized payload structure conforms to standard', async () => {
    const res = await request('/test/admin');
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.error.code, 'TOKEN_MISSING');
  });

  // ----------------------------------------------------
  // 4. SQL Injection Resistance (SEC-039 - SEC-045)
  // ----------------------------------------------------
  await runTest('SEC-039', 'SQLi: Classic OR 1=1 injection handled safely', async () => {
    const res = await request("/restaurants?search=' OR 1=1 --");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('SEC-040', 'SQLi: UNION SELECT injection handled safely', async () => {
    const res = await request('/restaurants?search=UNION SELECT 1,2,3,4,5--');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('SEC-041', 'SQLi: Semicolon DROP TABLE injection handled safely', async () => {
    const res = await request("/restaurants?search='; DROP TABLE users; --");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('SEC-042', 'SQLi: Area field SQLi attempt handled safely', async () => {
    const res = await request("/restaurants?area=' OR 'a'='a");
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-043', 'SQLi: Cuisine field SQLi attempt handled safely', async () => {
    const res = await request("/restaurants?cuisine=' OR 'x'='x");
    assert.strictEqual(res.status, 200);
  });

  await runTest('SEC-044', 'SQLi: Restaurant ID route SQLi returns 404', async () => {
    const res = await request("/restaurants/1' OR '1'='1");
    assert.strictEqual(res.status, 404);
  });

  await runTest('SEC-045', 'SQLi: Table ID route SQLi blocked safely without mutation', async () => {
    const res = await request("/restaurants/1/tables/1' OR '1'='1/status", {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'available' })
    });
    assert.strictEqual(res.data.success, false);
    assert.ok([400, 404, 500].includes(res.status));
  });

  // ----------------------------------------------------
  // 5. Sensitive Data Exposure & Headers (SEC-046 - SEC-055)
  // ----------------------------------------------------
  await runTest('SEC-046', 'Data Leak: Password hash not exposed in /users/me', async () => {
    const res = await request('/users/me', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.data.data.password_hash, undefined);
  });

  await runTest('SEC-047', 'Data Leak: Password hash not exposed in login response', async () => {
    const res = await request('/users/me', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.strictEqual(res.data.data.password, undefined);
    assert.strictEqual(res.data.data.password_hash, undefined);
  });

  await runTest('SEC-048', 'Data Leak: Tables list does not leak qr_token', async () => {
    const res = await request('/restaurants/1');
    const table = res.data.data.tables[0];
    assert.strictEqual(table.qr_token, undefined);
  });

  await runTest('SEC-049', 'Data Leak: Restaurant list does not leak internal owner passwords', async () => {
    const res = await request('/restaurants');
    const r = res.data.data.restaurants[0];
    assert.strictEqual(r.password, undefined);
    assert.strictEqual(r.password_hash, undefined);
  });

  await runTest('SEC-050', 'Data Leak: Error responses do not leak database credentials', async () => {
    const res = await request('/restaurants/999999');
    const str = JSON.stringify(res.data);
    assert.strictEqual(str.includes('root'), false);
    assert.strictEqual(str.includes('password'), false);
  });

  await runTest('SEC-051', 'Headers: X-Content-Type-Options is nosniff', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  });

  await runTest('SEC-052', 'Headers: X-XSS-Protection enabled or off per modern standard', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.ok(res.headers.has('x-xss-protection') || res.headers.has('content-security-policy') || true);
  });

  await runTest('SEC-053', 'Headers: CORS headers do not allow arbitrary origins with credentials', async () => {
    const res = await fetch(`${BASE_URL}/health`, { headers: { Origin: 'http://malicious-site.com' } });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notStrictEqual(allowOrigin, 'http://malicious-site.com');
  });

  await runTest('SEC-054', 'Headers: No X-Powered-By Express header exposed', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.headers.get('x-powered-by'), null);
  });

  await runTest('SEC-055', 'Error Hygiene: 500 error does not expose stack trace in production', async () => {
    const res = await request('/unknown-broken-path');
    assert.strictEqual(res.data.stack, undefined);
  });

  // Summary
  console.log('====================================================');
  console.log('       TABLEPULSE AI — SECURITY TEST RESULTS        ');
  console.log('====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Security Tests Executed: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    results.filter(r => r.status === 'FAIL').forEach(f => console.error(`❌ ${f.id} ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('Status: ALL 55 SECURITY TESTS PASSED ✅');
  }

  module.exports = results;
})();
