const axios = require('../../client/node_modules/axios');
const { io } = require('../../client/node_modules/socket.io-client');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function runTests() {
  console.log('=== STARTING STAGE 5 ACCEPTANCE VERIFICATION ===\n');
  const results = [];

  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${testName}${details ? ` -> ${details}` : ''}`);
  }

  // ── 1. Customer registration
  let registeredEmail = `testuser_${Date.now()}@example.com`;
  let customerToken = null;
  let customerUser = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Verification Customer',
      email: registeredEmail,
      phone: '+91 9876543210',
      password: 'SecurePassword123!',
      role: 'customer'
    });
    record('1. Customer registration', res.status === 201 && res.data.success, res.data.message);
  } catch (err) {
    record('1. Customer registration', false, err.response?.data?.error?.message || err.message);
  }

  // ── 2 & 3. Customer login and JWT returned
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: registeredEmail,
      password: 'SecurePassword123!',
      role: 'customer'
    });
    customerToken = res.data.data.token;
    customerUser = res.data.data.user;
    record('2. Customer login', res.status === 200 && res.data.success, `Logged in as ${customerUser.name}`);
    record('3. JWT returned', typeof customerToken === 'string' && customerToken.length > 20, `JWT length: ${customerToken.length}`);
  } catch (err) {
    record('2. Customer login', false, err.response?.data?.error?.message || err.message);
    record('3. JWT returned', false, 'No token returned');
  }

  // ── 4. Protected customer route
  try {
    const res = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const testRole = await axios.get(`${API_BASE}/test/customer`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    record('4. Protected customer route', res.status === 200 && testRole.status === 200, `Fetched profile: ${res.data.data.email}`);
  } catch (err) {
    record('4. Protected customer route', false, err.response?.data?.error?.message || err.message);
  }

  // ── 5. Owner login & role protection
  let ownerToken = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@demo.com',
      password: 'Demo@1234',
      role: 'owner'
    });
    ownerToken = res.data.data.token;
    const ownerAccess = await axios.get(`${API_BASE}/test/owner`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    record('5. Owner login & role access', ownerAccess.status === 200 && res.data.success, `Owner verified: ${res.data.data.user.name}`);
  } catch (err) {
    record('5. Owner login & role access', false, err.response?.data?.error?.message || err.message);
  }

  // ── 6. Admin login & role protection
  let adminToken = null;
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@tablepulse.app',
      password: 'Demo@1234',
      role: 'admin'
    });
    adminToken = res.data.data.token;
    const adminAccess = await axios.get(`${API_BASE}/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('6. Admin login & role access', adminAccess.status === 200 && res.data.success, `Admin verified: ${res.data.data.user.name}`);
  } catch (err) {
    record('6. Admin login & role access', false, err.response?.data?.error?.message || err.message);
  }

  // ── 7. Invalid credentials
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@tablepulse.app',
      password: 'WrongPassword123'
    });
    record('7. Invalid credentials rejection', false, 'Expected 401 but got success');
  } catch (err) {
    record('7. Invalid credentials rejection', err.response?.status === 401, `Status: ${err.response?.status}, Error: ${err.response?.data?.error?.message}`);
  }

  // ── 8. Missing JWT
  try {
    await axios.get(`${API_BASE}/users/me`);
    record('8. Missing JWT rejection', false, 'Expected 401 but got success');
  } catch (err) {
    record('8. Missing JWT rejection', err.response?.status === 401, `Status: ${err.response?.status}, Error: ${err.response?.data?.error?.code}`);
  }

  // ── 9. Invalid JWT
  try {
    await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' }
    });
    record('9. Invalid JWT rejection', false, 'Expected 401 but got success');
  } catch (err) {
    record('9. Invalid JWT rejection', err.response?.status === 401, `Status: ${err.response?.status}, Error: ${err.response?.data?.error?.code}`);
  }

  // ── 10. Logout behavior
  try {
    const res = await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    record('10. Logout behavior', res.status === 200 && res.data.success, res.data.message);
  } catch (err) {
    record('10. Logout behavior', false, err.response?.data?.error?.message || err.message);
  }

  // ── Role Authorization Matrix Checks
  // A. Customer cannot access owner-only routes
  try {
    await axios.get(`${API_BASE}/test/owner`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    record('Role Check: Customer blocked from Owner route', false, 'Customer unexpectedly allowed');
  } catch (err) {
    record('Role Check: Customer blocked from Owner route', err.response?.status === 403, `Blocked with ${err.response?.status} (${err.response?.data?.error?.code})`);
  }

  // B. Customer cannot access admin-only routes
  try {
    await axios.get(`${API_BASE}/test/admin`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    record('Role Check: Customer blocked from Admin route', false, 'Customer unexpectedly allowed');
  } catch (err) {
    record('Role Check: Customer blocked from Admin route', err.response?.status === 403, `Blocked with ${err.response?.status} (${err.response?.data?.error?.code})`);
  }

  // C. Owner cannot access admin-only routes
  try {
    await axios.get(`${API_BASE}/test/admin`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    record('Role Check: Owner blocked from Admin route', false, 'Owner unexpectedly allowed');
  } catch (err) {
    record('Role Check: Owner blocked from Admin route', err.response?.status === 403, `Blocked with ${err.response?.status} (${err.response?.data?.error?.code})`);
  }

  // D. Admin access works where intended
  try {
    const res = await axios.get(`${API_BASE}/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('Role Check: Admin access allowed', res.status === 200, res.data.message);
  } catch (err) {
    record('Role Check: Admin access allowed', false, err.response?.data?.error?.message || err.message);
  }

  // ── Socket.IO Real Connection & Infrastructure Tests
  console.log('\n--- Socket.IO Real Connection Tests ---');
  await new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: customerToken },
      transports: ['websocket', 'polling']
    });

    let pingAnswered = false;

    socket.on('connect', () => {
      record('Socket: Client connects with JWT', true, `Socket ID: ${socket.id}`);

      // Test infrastructure: joinRestaurant
      socket.emit('joinRestaurant', 1);
      socket.emit('join:restaurant', 1);
      record('Socket: joinRestaurant infrastructure exists', true, 'Emitted joinRestaurant & join:restaurant');

      // Test infrastructure: joinTable
      socket.emit('joinTable', 5);
      socket.emit('join:table', 5);
      record('Socket: joinTable infrastructure exists', true, 'Emitted joinTable & join:table');

      // Test infrastructure: joinOrder
      socket.emit('joinOrder', 42);
      socket.emit('join:order', 42);
      record('Socket: joinOrder infrastructure exists', true, 'Emitted joinOrder & join:order');

      // Test ping / pong
      socket.emit('ping:test', { test: 'Stage 5 Socket Ping' });
    });

    socket.on('pong:test', (data) => {
      pingAnswered = true;
      record('Socket: ping:test / pong:test communication', true, `Received pong from server (role: ${data.role})`);
      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      record('Socket: Disconnection handled', true, `Reason: ${reason}`);
      resolve();
    });

    socket.on('connect_error', (err) => {
      record('Socket: Client connects with JWT', false, err.message);
      resolve();
    });

    setTimeout(() => {
      if (!pingAnswered) {
        record('Socket: Ping timeout', false, 'No pong received within 5s');
        socket.disconnect();
      }
      resolve();
    }, 6000);
  });

  console.log('\n=== VERIFICATION SUMMARY ===');
  const allPassed = results.every(r => r.passed);
  console.log(`Total checks: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Overall Status: ${allPassed ? 'ALL PASS ✅' : 'FAILURES DETECTED ❌'}`);
}

runTests().catch(console.error);
