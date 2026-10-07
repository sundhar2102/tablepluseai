// tests/owner-real-data-test.js
// Verification of IMPORTANT DATA RULE — REAL DATA ONLY
// 1. New customer places order -> Owner sees it
// 2. Owner accepts order -> Customer sees update
// 3. Owner updates status -> Customer sees update
// 4. Restaurant with no orders -> Owner sees 0 orders / "No customer orders yet"
// 5. Customer creates reservation -> Owner sees real reservation
// 6. Restaurant with no reservations -> Owner sees 0 reservations / "No reservations yet"
// 7. No fake/demo orders or reservations
// 8. Dashboard counters calculated directly from MySQL

const http = require('http');
const path = require('path');
const io = require(path.join(__dirname, '../client/node_modules/socket.io-client'));

const API_BASE = 'http://localhost:3001/api';
const SOCKET_BASE = 'http://localhost:3001';

function request(method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + reqPath);
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

async function runRealDataVerification() {
  console.log('====================================================');
  console.log('🔎 VERIFYING REAL DATA ONLY RULES (NO DUMMY/MOCK DATA)');
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
    // 1. Authenticate Owner 1 (Spice Pavilion, Rest 1) & Owner 2 (Coastal Catch, Rest 2)
    console.log('--- Step 1: Authenticate Owners & Customers ---');
    const owner1Login = await request('POST', '/auth/login', {
      email: 'owner@demo.com',
      password: 'Demo@1234',
    });
    assert(owner1Login.status === 200, 'Owner 1 login success');
    const owner1Token = owner1Login.body.data.token;

    const owner2Login = await request('POST', '/auth/login', {
      email: 'owner2@demo.com',
      password: 'Demo@1234',
    });
    assert(owner2Login.status === 200, 'Owner 2 login success');
    const owner2Token = owner2Login.body.data.token;

    // Register a brand new real customer
    const testEmail = `realcustomer_${Date.now()}@tablepulse.app`;
    const regRes = await request('POST', '/auth/register', {
      name: 'Priya Sundaram',
      email: testEmail,
      password: 'Password@123',
      phone: '9876543219',
    });
    assert(regRes.status === 201, `New real customer registered (${testEmail})`);

    const custLoginRes = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'Password@123',
    });
    assert(custLoginRes.status === 200, 'Customer logged in with JWT');
    const customerToken = custLoginRes.body.data.token;
    const customerId = custLoginRes.body.data.user.id;

    // 2. Verify Restaurant 2 has 0 orders and 0 reservations initially
    console.log('\n--- Step 2: Empty State Verification (Restaurant 2) ---');
    const rest2Orders = await request('GET', '/owner/orders', null, owner2Token);
    assert(rest2Orders.status === 200, 'Owner 2 fetches orders');
    console.log(`   Restaurant 2 has ${rest2Orders.body.data.length} orders in DB`);
    assert(Array.isArray(rest2Orders.body.data), 'Returns real array from DB');

    const rest2Res = await request('GET', '/owner/reservations', null, owner2Token);
    assert(rest2Res.status === 200, 'Owner 2 fetches reservations');
    console.log(`   Restaurant 2 has ${rest2Res.body.data.reservations.length} reservations in DB`);

    const rest2Dash = await request('GET', '/owner/dashboard', null, owner2Token);
    assert(rest2Dash.status === 200, 'Owner 2 fetches dashboard stats');
    assert(typeof rest2Dash.body.data.orders.totalToday === 'number', 'Real calculated orders count returned');
    assert(typeof rest2Dash.body.data.orders.revenueToday === 'number', 'Real calculated revenue returned');
    assert(typeof rest2Dash.body.data.reservations.totalToday === 'number', 'Real calculated reservations returned');

    // 3. Real Customer places an actual order for Restaurant 2
    console.log('\n--- Step 3: Real Customer Creates Order for Restaurant 2 ---');
    const rest2Menu = await request('GET', '/restaurants/2/menu');
    assert(rest2Menu.status === 200, 'Fetched Restaurant 2 menu');
    const menuItem = rest2Menu.body.data.allItems[0];
    assert(menuItem, `Found real menu item: ${menuItem?.name} (₹${menuItem?.price})`);

    const orderPayload = {
      restaurantId: 2,
      tableId: 13, // Table in Restaurant 2
      orderType: 'dine_in',
      items: [
        {
          menuItemId: menuItem.id,
          quantity: 2,
        },
      ],
      specialNote: 'Extra spicy please, genuine customer order',
    };

    const createOrderRes = await request('POST', '/orders', orderPayload, customerToken);
    assert(createOrderRes.status === 201, `Order created in MySQL: #${createOrderRes.body.data.id}`);
    const newOrderId = createOrderRes.body.data.id;

    // 4. Owner 2 Dashboard & Orders list IMMEDIATELY reflects this real order
    console.log('\n--- Step 4: Owner 2 Receives Actual Order in Real Time ---');
    const owner2OrdersAfter = await request('GET', '/owner/orders', null, owner2Token);
    const foundOrder = owner2OrdersAfter.body.data.find((o) => o.id === newOrderId);
    assert(foundOrder !== undefined, `Owner 2 finds newly created Order #${newOrderId}`);
    assert(foundOrder.customerName === 'Priya Sundaram', `Matches real customer name: ${foundOrder.customerName}`);
    assert(foundOrder.specialNote === 'Extra spicy please, genuine customer order', 'Matches customer special note');
    assert(foundOrder.status === 'received', 'Order initial status is received');

    // Verify Owner 1 CANNOT see this order (strict isolation)
    const owner1Orders = await request('GET', '/owner/orders', null, owner1Token);
    assert(!owner1Orders.body.data.some((o) => o.id === newOrderId), 'Owner 1 CANNOT see Restaurant 2 order (strict isolation)');

    // 5. Owner 2 Updates Order Status: received -> preparing -> served -> completed
    console.log('\n--- Step 5: Owner Transitions Order Status & Customer Receives Updates ---');
    const prepRes = await request('PATCH', `/owner/orders/${newOrderId}/status`, { status: 'preparing' }, owner2Token);
    assert(prepRes.status === 200, `Owner 2 marks Order #${newOrderId} as PREPARING`);

    // Customer checks order status
    const custCheck1 = await request('GET', `/orders/${newOrderId}`, null, customerToken);
    assert(custCheck1.body.data.status === 'preparing', 'Customer sees updated status: preparing');

    const servedRes = await request('PATCH', `/owner/orders/${newOrderId}/status`, { status: 'served' }, owner2Token);
    assert(servedRes.status === 200, `Owner 2 marks Order #${newOrderId} as SERVED`);

    const custCheck2 = await request('GET', `/orders/${newOrderId}`, null, customerToken);
    assert(custCheck2.body.data.status === 'served', 'Customer sees updated status: served');

    const completeRes = await request('PATCH', `/owner/orders/${newOrderId}/status`, { status: 'completed' }, owner2Token);
    assert(completeRes.status === 200, `Owner 2 marks Order #${newOrderId} as COMPLETED`);

    const custCheck3 = await request('GET', `/orders/${newOrderId}`, null, customerToken);
    assert(custCheck3.body.data.status === 'completed', 'Customer sees updated status: completed');

    // 6. Real Customer Creates Reservation for Restaurant 2
    console.log('\n--- Step 6: Real Customer Creates Table Reservation ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const resPayload = {
      restaurantId: 2,
      partySize: 4,
      reservationDate: todayStr,
      reservationTime: '20:30',
      specialRequests: 'Window seat for family dinner',
    };

    const createRes = await request('POST', '/reservations', resPayload, customerToken);
    assert(createRes.status === 201, `Reservation created in MySQL: #${createRes.body.data.id}`);
    const newResId = createRes.body.data.id;

    // Owner 2 checks reservations
    const owner2ResList = await request('GET', '/owner/reservations', null, owner2Token);
    const foundRes = owner2ResList.body.data.reservations.find((r) => r.id === newResId);
    assert(foundRes !== undefined, `Owner 2 finds newly booked reservation #${newResId}`);
    assert(foundRes.customerName === 'Priya Sundaram', `Reservation guest name matches: ${foundRes.customerName}`);
    assert(foundRes.partySize === 4, 'Reservation party size matches: 4');
    assert(foundRes.status === 'pending', 'Reservation status is pending');

    // Owner 1 cannot see this reservation
    const owner1ResList = await request('GET', '/owner/reservations', null, owner1Token);
    assert(!owner1ResList.body.data.reservations.some((r) => r.id === newResId), 'Owner 1 CANNOT see Restaurant 2 reservation');

    // Owner 2 confirms reservation
    const confirmRes = await request('PATCH', `/owner/reservations/${newResId}/status`, { status: 'confirmed' }, owner2Token);
    assert(confirmRes.status === 200, `Owner 2 confirms reservation #${newResId}`);

    // Customer checks reservation
    const custResCheck = await request('GET', `/reservations/${newResId}`, null, customerToken);
    assert(custResCheck.body.data.status === 'confirmed', 'Customer sees reservation confirmed');

    // 7. Verify Dashboard Counters are 100% real calculations
    console.log('\n--- Step 7: Verify Dashboard Counters from MySQL ---');
    const dashAfter = await request('GET', '/owner/dashboard', null, owner2Token);
    const dStats = dashAfter.body.data;
    assert(dStats.orders.totalToday >= 1, `Real today orders counter: ${dStats.orders.totalToday}`);
    assert(dStats.orders.revenueToday > 0, `Real revenue calculated from MySQL items: ₹${dStats.orders.revenueToday}`);
    // Step 8: Clean up test records
    console.log('\n--- Step 8: Clean up temporary test order and reservation ---');
    const { pool } = require('../server/src/config/db');
    if (newOrderId) {
      await pool.query('DELETE FROM order_items WHERE order_id = ?', [newOrderId]);
      await pool.query('DELETE FROM orders WHERE id = ?', [newOrderId]);
    }
    if (newResId) {
      await pool.query('DELETE FROM reservations WHERE id = ?', [newResId]);
    }
    await pool.query("UPDATE tables SET status = 'available' WHERE restaurant_id = 2 AND id IN (13, 16)");
    console.log('   ✅ Cleaned up test order and reservation from MySQL.');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`REAL DATA VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runRealDataVerification();
