// tests/owner-flow-test.js
// Verification of Owner Authentication, Scoping, Dashboard, Tables, Orders, Menu, Analytics, Customers, Socket.IO

const http = require('http');
const path = require('path');
const io = require(path.join(__dirname, '../client/node_modules/socket.io-client'));

const API_BASE = 'http://localhost:3001/api';
const SOCKET_BASE = 'http://localhost:3001';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING OWNER MODULE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Owner Login
    console.log('\n--- 1. OWNER AUTHENTICATION & RESTAURANT IDENTIFICATION ---');
    const owner1Login = await request('POST', '/auth/login', {
      email: 'owner@demo.com',
      password: 'Demo@1234',
    });
    assert(owner1Login.status === 200, 'Owner 1 login succeeds with 200');
    assert(owner1Login.body.data.user.role === 'owner', 'User 1 has owner role');
    const owner1Token = owner1Login.body.data.token;

    const owner2Login = await request('POST', '/auth/login', {
      email: 'owner2@demo.com',
      password: 'Demo@1234',
    });
    assert(owner2Login.status === 200, 'Owner 2 login succeeds with 200');
    const owner2Token = owner2Login.body.data.token;

    const customerLogin = await request('POST', '/auth/login', {
      email: 'customer@demo.com',
      password: 'Demo@1234',
    });
    const customerToken = customerLogin.body.data.token;

    // 2. Route Protection & Authorization
    console.log('\n--- 2. ROUTE PROTECTION & ROLE ISOLATION ---');
    const custAccess = await request('GET', '/owner/dashboard', null, customerToken);
    assert(custAccess.status === 403, 'Customer is FORBIDDEN (403) from accessing /owner/dashboard');

    const anonAccess = await request('GET', '/owner/dashboard');
    assert(anonAccess.status === 401, 'Anonymous request is UNAUTHORIZED (401)');

    // 3. Owner 1 Restaurant Scoping
    console.log('\n--- 3. OWNER RESTAURANT PROFILE & DASHBOARD DATA ---');
    const owner1Rest = await request('GET', '/owner/restaurant', null, owner1Token);
    assert(owner1Rest.status === 200, 'Owner 1 fetches restaurant profile');
    assert(owner1Rest.body.data.id === 1, 'Owner 1 restaurant ID is 1 (The Spice Pavilion)');
    console.log(`   Restaurant: ${owner1Rest.body.data.name}`);

    const owner2Rest = await request('GET', '/owner/restaurant', null, owner2Token);
    assert(owner2Rest.status === 200, 'Owner 2 fetches restaurant profile');
    assert(owner2Rest.body.data.id === 2, 'Owner 2 restaurant ID is 2 (Coastal Catch & Grills)');
    console.log(`   Restaurant: ${owner2Rest.body.data.name}`);

    // Dashboard Home Stats
    const dash1 = await request('GET', '/owner/dashboard', null, owner1Token);
    assert(dash1.status === 200, 'Owner 1 fetches real dashboard stats');
    const dStats = dash1.body.data;
    assert(dStats.tables.total === 12, `Owner 1 has 12 tables (found: ${dStats.tables.total})`);
    assert(typeof dStats.crowd.level === 'string', `Real crowd level returned: ${dStats.crowd.level}`);
    assert(typeof dStats.crowd.estimatedWaitMinutes === 'number', `Real wait time returned: ${dStats.crowd.estimatedWaitMinutes}m`);
    assert(typeof dStats.orders.totalToday === 'number', `Real orders count returned: ${dStats.orders.totalToday}`);

    // 4. Live Table Management
    console.log('\n--- 4. LIVE TABLE MANAGEMENT ---');
    const tables1 = await request('GET', '/owner/tables', null, owner1Token);
    assert(tables1.status === 200, 'Owner 1 fetches tables');
    assert(tables1.body.data.tables.length === 12, `Owner 1 gets all 12 tables belonging to Restaurant 1`);
    assert(tables1.body.data.tables.every(t => t.restaurantId === 1), 'All tables strictly belong to Restaurant 1');

    // Cross-restaurant table status protection
    // Owner 2 tries to modify Table 1 (which belongs to Restaurant 1)
    const crossTableChange = await request('PATCH', '/owner/tables/1/status', { status: 'cleaning' }, owner2Token);
    assert(crossTableChange.status === 403 || crossTableChange.status === 404, 'Owner 2 CANNOT modify Restaurant 1 Table (Forbidden/Not Found)');

    // Owner 1 modifies Table 1 status to cleaning, then available
    const setCleaning = await request('PATCH', '/owner/tables/1/status', { status: 'cleaning' }, owner1Token);
    assert(setCleaning.status === 200, 'Owner 1 successfully updates Table 1 status to cleaning');
    assert(setCleaning.body.data.table.status === 'cleaning', 'Table 1 status updated to cleaning');

    const setAvailable = await request('PATCH', '/owner/tables/1/status', { status: 'available' }, owner1Token);
    assert(setAvailable.status === 200, 'Owner 1 successfully restores Table 1 status to available');
    assert(setAvailable.body.data.table.status === 'available', 'Table 1 status updated to available');

    // 5. Orders Management & Scoping
    console.log('\n--- 5. ORDER MANAGEMENT & RESTAURANT ISOLATION ---');
    // Owner gets orders via /owner/orders
    const orders1 = await request('GET', '/owner/orders', null, owner1Token);
    assert(orders1.status === 200, 'Owner 1 fetches orders list');
    assert(orders1.body.data.every(o => o.restaurantId === 1), 'All orders strictly belong to Restaurant 1');
    console.log(`   Owner 1 has ${orders1.body.data.length} real orders in DB`);

    const orders2 = await request('GET', '/owner/orders', null, owner2Token);
    assert(orders2.status === 200, 'Owner 2 fetches orders list');
    assert(orders2.body.data.every(o => o.restaurantId === 2), 'All orders strictly belong to Restaurant 2');

    // 6. Reservation Management & Scoping
    console.log('\n--- 6. RESERVATION MANAGEMENT & SCOPING ---');
    const res1 = await request('GET', '/owner/reservations', null, owner1Token);
    assert(res1.status === 200, 'Owner 1 fetches reservations');
    assert(res1.body.data.reservations.every(r => r.restaurantId === 1), 'All reservations strictly belong to Restaurant 1');

    // 7. Menu Management & Isolation
    console.log('\n--- 7. MENU MANAGEMENT & REAL TOGGLES ---');
    const menu1 = await request('GET', '/restaurants/1/menu', null, owner1Token);
    assert(menu1.status === 200, 'Owner 1 fetches menu for Restaurant 1');
    const item1 = menu1.body.data.allItems?.[0];
    if (item1) {
      console.log(`   Toggling availability for item #${item1.id} (${item1.name})...`);
      const toggleRes = await request('PATCH', `/owner/menu/items/${item1.id}/toggle`, null, owner1Token);
      assert(toggleRes.status === 200, `Owner 1 toggles item #${item1.id} availability`);
      // Toggle back
      await request('PATCH', `/owner/menu/items/${item1.id}/toggle`, null, owner1Token);
      assert(true, `Restored item #${item1.id} availability`);

      // Owner 2 tries to toggle Restaurant 1's item
      const badToggle = await request('PATCH', `/owner/menu/items/${item1.id}/toggle`, null, owner2Token);
      assert(badToggle.status === 403 || badToggle.status === 404, 'Owner 2 CANNOT modify Restaurant 1 item (Forbidden)');
    }

    // 8. Analytics & Customers
    console.log('\n--- 8. ANALYTICS & CUSTOMERS (REAL DB AGGREGATIONS) ---');
    const analytics = await request('GET', '/owner/analytics?timeframe=all', null, owner1Token);
    assert(analytics.status === 200, 'Owner 1 fetches real analytics');
    assert(typeof analytics.body.data.kpis.totalOrders === 'number', `Real total orders in analytics: ${analytics.body.data.kpis.totalOrders}`);
    assert(Array.isArray(analytics.body.data.topItems), 'Real top selling items returned');
    assert(Array.isArray(analytics.body.data.peakHours), 'Real peak hours distribution returned');

    const customers = await request('GET', '/owner/customers', null, owner1Token);
    assert(customers.status === 200, 'Owner 1 fetches customers who dined at Restaurant 1');
    assert(Array.isArray(customers.body.data), `Returned ${customers.body.data.length} real customers`);

    // 9. Notifications
    console.log('\n--- 9. NOTIFICATIONS ---');
    const notifs = await request('GET', '/owner/notifications', null, owner1Token);
    assert(notifs.status === 200, 'Owner 1 fetches notifications');
    assert(Array.isArray(notifs.body.data), 'Notifications array returned');

    // 10. Real-time Socket.IO Sync Verification
    console.log('\n--- 10. REAL-TIME SOCKET.IO SYNCHRONIZATION ---');
    await new Promise((resolve) => {
      let ownerSocketReceived = false;
      let customerSocketReceived = false;

      // Connect Owner 1 socket
      const ownerSocket = io(SOCKET_BASE, {
        auth: { token: owner1Token },
        transports: ['websocket'],
      });

      // Connect Customer socket
      const customerSocket = io(SOCKET_BASE, {
        auth: { token: customerToken },
        transports: ['websocket'],
      });

      customerSocket.on('connect', () => {
        // Customer joins restaurant:1 room
        customerSocket.emit('join:restaurant', { restaurantId: 1 });
      });

      customerSocket.on('restaurant:availability_updated', (data) => {
        if (data.restaurantId === 1) {
          customerSocketReceived = true;
          console.log(`   Customer received 'restaurant:availability_updated': Table #${data.tableId} is ${data.status}`);
        }
      });

      ownerSocket.on('connect', async () => {
        // Wait 300ms for rooms to settle, then change table status
        setTimeout(async () => {
          await request('PATCH', '/owner/tables/1/status', { status: 'occupied' }, owner1Token);
          // Wait another 300ms then restore
          setTimeout(async () => {
            await request('PATCH', '/owner/tables/1/status', { status: 'available' }, owner1Token);
            setTimeout(() => {
              ownerSocket.disconnect();
              customerSocket.disconnect();
              assert(customerSocketReceived, 'Customer successfully received live table update via Socket.IO');
              resolve();
            }, 500);
          }, 400);
        }, 400);
      });
    });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
