/**
 * TablePulse AI — Customer Flow Automated Verification
 * Tests the complete Customer Flow:
 * - Customer Registration & Login
 * - Customer Restaurant Discovery (all registered/active restaurants from DB)
 * - Restaurant Selection & Details (strict restaurantId scoping)
 * - Crowd / Rush calculation & Estimated Wait Time
 * - Live Table Statuses
 * - Menu retrieval & Pre-order creation
 * - Real-time Socket.IO synchronization on table status change
 * - Multi-restaurant data isolation (no cross-restaurant data leakage)
 */

const axios = require('../client/node_modules/axios');
const { io } = require('../client/node_modules/socket.io-client');

const API_BASE = 'http://127.0.0.1:3001/api';
const SOCKET_URL = 'http://127.0.0.1:3001';

async function runVerification() {
  console.log('\n====================================================');
  console.log('   TABLEPULSE AI — CUSTOMER MODULE VERIFICATION     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extraInfo ? `(${extraInfo})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo ? `(${extraInfo})` : ''}`);
      failed++;
    }
  }

  // 1. Customer registration & login
  const testEmail = `cust_${Date.now()}@test.com`;
  const password = 'Password@123';

  console.log(`[1] Registering test customer: ${testEmail}...`);
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Priya Raman',
    email: testEmail,
    phone: '9840123456',
    password,
    role: 'customer',
  });
  assert(regRes.data.success, 'Customer Registration');

  console.log('[2] Logging in as Customer...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testEmail,
    password,
  });
  assert(loginRes.data.success && loginRes.data.data.token, 'Customer Login & JWT retrieval');
  const token = loginRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Customer fetches ALL registered restaurants
  console.log('\n[3] Fetching all registered restaurants from database...');
  const restListRes = await axios.get(`${API_BASE}/restaurants`, { headers: authHeaders });
  assert(restListRes.data.success, 'GET /api/restaurants status 200');
  const restaurants = restListRes.data.data.restaurants;
  assert(Array.isArray(restaurants) && restaurants.length >= 5, 'All registered restaurants returned', `Count: ${restaurants.length}`);
  
  // Verify each card contains necessary info
  const restA = restaurants.find((r) => r.id === 1);
  const restB = restaurants.find((r) => r.id === 2);
  const restC = restaurants.find((r) => r.id === 3);

  assert(restA && (restA.name === 'TablePulse Restaurant' || restA.name === 'The Spice Pavilion'), 'Restaurant 1 present in list', restA?.name);
  assert(restB && restB.name === 'Coastal Catch & Grills', 'Restaurant 2 present in list', restB.name);
  assert(restC && restC.name === 'Aura Bistro & Cafe', 'Restaurant 3 present in list', restC.name);

  restaurants.forEach((r) => {
    assert(
      r.id && r.name && r.address && r.crowdLevel && r.tableAvailability && r.estimatedWaitMinutes !== undefined,
      `Restaurant #${r.id} card contains name, address, crowd (${r.crowdLevel}), wait (${r.estimatedWaitMinutes}m), tables free (${r.tableAvailability.availableTables}/${r.tableAvailability.totalTables})`
    );
  });

  // 4. Select Restaurant A (ID 1)
  console.log('\n[4] Selecting Restaurant A (ID 1)...');
  const restADetailsRes = await axios.get(`${API_BASE}/restaurants/1`, { headers: authHeaders });
  const restADetails = restADetailsRes.data.data;
  assert(restADetails.id === 1, 'Restaurant A ID matches 1');
  assert(restADetails.name === 'TablePulse Restaurant' || restADetails.name === 'The Spice Pavilion', 'Restaurant A details retrieved', restADetails.name);
  assert(['LOW', 'MODERATE', 'HIGH', 'FULL'].includes(restADetails.crowdLevel), 'Restaurant A crowd level valid', restADetails.crowdLevel);
  assert(typeof restADetails.estimatedWaitMinutes === 'number', 'Restaurant A wait time calculated', `${restADetails.estimatedWaitMinutes} mins`);
  assert(Array.isArray(restADetails.tables) && restADetails.tables.length === 12, 'Restaurant A has 12 tables');
  assert(restADetails.menu?.allItems?.length > 0, 'Restaurant A has menu items', `${restADetails.menu.allItems.length} items`);

  // 5. Select Restaurant B (ID 2) - Verify Data Isolation
  console.log('\n[5] Selecting Restaurant B (ID 2) — Checking isolation...');
  const restBDetailsRes = await axios.get(`${API_BASE}/restaurants/2`, { headers: authHeaders });
  const restBDetails = restBDetailsRes.data.data;
  assert(restBDetails.id === 2, 'Restaurant B ID matches 2');
  assert(restBDetails.name === 'Coastal Catch & Grills', 'Restaurant B details retrieved', restBDetails.name);
  assert(restBDetails.tables.length === 8, 'Restaurant B has 8 tables (distinct from Rest A 12 tables)');
  
  // Verify Restaurant B menu is different from Restaurant A menu
  const restANames = restADetails.menu.allItems.map((i) => i.name);
  const restBNames = restBDetails.menu.allItems.map((i) => i.name);
  const crossPollution = restBNames.some((b) => restANames.includes(b));
  assert(!crossPollution, 'Zero menu leakage between Restaurant A and Restaurant B', `Rest B items: ${restBNames.join(', ')}`);

  // 6. Test Non-Existent Restaurant Returns 404 (Never falls back to Restaurant 1)
  console.log('\n[6] Testing 404 on invalid restaurant ID 9999...');
  try {
    await axios.get(`${API_BASE}/restaurants/9999`, { headers: authHeaders });
    assert(false, 'Should return 404 for non-existent restaurant');
  } catch (err) {
    assert(err.response?.status === 404, 'Returns 404 for invalid restaurant ID (no silent fallback)');
  }

  // 7. Pre-order item selection and order placement
  console.log('\n[7] Pre-ordering menu items for Restaurant A...');
  const itemToOrder = restADetails.menu.allItems[0];
  const orderRes = await axios.post(
    `${API_BASE}/orders`,
    {
      restaurantId: 1,
      tableId: restADetails.tables[0].id,
      items: [{ menuItemId: itemToOrder.id, quantity: 2 }],
      specialNote: 'Pre-order while waiting for table seating',
    },
    { headers: authHeaders }
  );
  assert(orderRes.data.success, 'Pre-order created successfully', `Order ID: ${orderRes.data.data.order?.id || orderRes.data.data.id}`);

  // 8. Real-time Socket.IO synchronization on table status change
  console.log('\n[8] Testing Real-Time Socket.IO Synchronization...');
  
  // Login as owner to update table status
  const ownerLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'owner@demo.com',
    password: 'Demo@1234',
  });
  const ownerToken = ownerLogin.data.data.token;
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  await new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token } });
    let timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket.IO test timed out after 8s'));
    }, 8000);

    socket.on('connect', async () => {
      console.log('   Connected to Socket.IO! Joining room restaurant:1...');
      socket.emit('join:restaurant', 1);

      socket.on('restaurant:availability_updated', (payload) => {
        console.log('   ⚡ Received restaurant:availability_updated event!');
        assert(Number(payload.restaurantId) === 1, 'Event belongs to restaurant 1');
        assert(payload.newStatus === 'occupied' || payload.newStatus === 'available', 'Table status in payload', payload.newStatus);
        assert(payload.tableAvailability !== undefined, 'Live table availability included in payload');
        assert(payload.crowdLevel !== undefined, 'Live crowd level included in payload', payload.crowdLevel);
        assert(payload.estimatedWaitMinutes !== undefined, 'Live estimated wait minutes included', `${payload.estimatedWaitMinutes}m`);

        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      });

      // Small delay then owner/admin triggers table status update
      setTimeout(async () => {
        try {
          const table1 = restADetails.tables[0];
          const newStatus = table1.status === 'available' ? 'occupied' : 'available';
          console.log(`   Owner updating table ${table1.tableNumber} status from ${table1.status} to ${newStatus}...`);
          await axios.patch(
            `${API_BASE}/restaurants/1/tables/${table1.id}/status`,
            { status: newStatus },
            { headers: ownerHeaders }
          );
        } catch (err) {
          clearTimeout(timeout);
          socket.disconnect();
          reject(err);
        }
      }, 500);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(err);
    });
  });

  assert(true, 'Real-time table status, crowd, and wait-time synchronization verified');

  console.log('\n====================================================');
  console.log(`   VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Unhandled verification error:', err.response?.data || err.message);
  process.exit(1);
});
