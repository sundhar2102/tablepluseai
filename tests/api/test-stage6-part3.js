const axios = require('../../client/node_modules/axios');
const { io } = require('../../client/node_modules/socket.io-client');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function runStage6Part3Tests() {
  console.log('\n====================================================');
  console.log('  TABLEPULSE AI — STAGE 6 PART 3 AUTOMATED TESTS');
  console.log('  DIGITAL MENU, QR ORDERING & ORDER MANAGEMENT');
  console.log('====================================================\n');

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  function record(testId, testName, passed, details) {
    if (passed) passedCount++;
    else failedCount++;
    results.push({ testId, testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${testId}] ${testName}${details ? ` -> ${details}` : ''}`);
  }

  // ── Authentication Setup ───────────────────────────────────
  let customer1Token = null;
  let customer1Id = null;
  let customer2Token = null;
  let customer2Id = null;
  let ownerToken = null;
  let ownerRestaurantId = 1;

  try {
    const rand = Date.now();
    // Register Customer 1
    const c1Email = `cust1_${rand}@example.com`;
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'Customer One',
      email: c1Email,
      phone: '+91 9876543210',
      password: 'Password123!',
      role: 'customer',
    });
    const c1Login = await axios.post(`${API_BASE}/auth/login`, {
      email: c1Email,
      password: 'Password123!',
      role: 'customer',
    });
    customer1Token = c1Login.data.data.token;
    customer1Id = c1Login.data.data.user.id;

    // Register Customer 2
    const c2Email = `cust2_${rand}@example.com`;
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'Customer Two',
      email: c2Email,
      phone: '+91 9876543211',
      password: 'Password123!',
      role: 'customer',
    });
    const c2Login = await axios.post(`${API_BASE}/auth/login`, {
      email: c2Email,
      password: 'Password123!',
      role: 'customer',
    });
    customer2Token = c2Login.data.data.token;
    customer2Id = c2Login.data.data.user.id;

    // Login Owner
    const oLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@demo.com',
      password: 'Demo@1234',
      role: 'owner',
    });
    ownerToken = oLogin.data.data.token;
    ownerRestaurantId = oLogin.data.data.user.restaurantId || 1;

    record('S6.3-AUTH', 'Test accounts authenticated', true, `Cust1: ${customer1Id}, Cust2: ${customer2Id}, Owner: ${ownerRestaurantId}`);
  } catch (err) {
    record('S6.3-AUTH', 'Test accounts authenticated', false, err.message);
    console.error('Fatal: Auth setup failed, aborting suite');
    return;
  }

  // ── GROUP 1: Digital Menu & QR Endpoints ───────────────────
  try {
    const res = await axios.get(`${API_BASE}/restaurants/1/menu`);
    const isOk = res.status === 200 && res.data.success && Array.isArray(res.data.data.categories);
    record('S6.3-MENU-01', 'GET /restaurants/:id/menu returns categories and items', isOk, `Found ${res.data.data.categories?.length} categories, ${res.data.data.allItems?.length} items`);
  } catch (err) {
    record('S6.3-MENU-01', 'GET /restaurants/:id/menu returns categories and items', false, err.message);
  }

  try {
    const res = await axios.get(`${API_BASE}/menu/items/1`);
    const isOk = res.status === 200 && res.data.data && res.data.data.name;
    record('S6.3-MENU-02', 'GET /menu/items/:id returns item details', isOk, `Item: ${res.data.data?.name} (₹${res.data.data?.price})`);
  } catch (err) {
    record('S6.3-MENU-02', 'GET /menu/items/:id returns item details', false, err.message);
  }

  try {
    const validQr = '11111111-0001-4000-8000-000000000001';
    const res = await axios.get(`${API_BASE}/tables/qr/${validQr}`);
    const isOk = res.status === 200 && res.data.data.table.tableNumber === 'T-01';
    record('S6.3-QR-01', 'GET /tables/qr/:token resolves valid table & restaurant', isOk, `Table: ${res.data.data?.table?.tableNumber}, Restaurant: ${res.data.data?.restaurant?.name}`);
  } catch (err) {
    record('S6.3-QR-01', 'GET /tables/qr/:token resolves valid table & restaurant', false, err.message);
  }

  try {
    await axios.get(`${API_BASE}/tables/qr/invalid-qr-token-9999`);
    record('S6.3-QR-02', 'GET /tables/qr/:token returns 404 on invalid token', false, 'Expected 404');
  } catch (err) {
    const isOk = err.response?.status === 404 && err.response?.data?.error?.code === 'QR_NOT_FOUND';
    record('S6.3-QR-02', 'GET /tables/qr/:token returns 404 on invalid token', isOk, `Status 404, code: ${err.response?.data?.error?.code}`);
  }

  // ── GROUP 2: Order Placement & Validations ─────────────────
  try {
    await axios.post(`${API_BASE}/orders`, { restaurantId: 1, tableId: 1, items: [{ menuItemId: 1, quantity: 1 }] });
    record('S6.3-ORDER-01', 'POST /orders requires authentication', false, 'Expected 401');
  } catch (err) {
    const isOk = err.response?.status === 401;
    record('S6.3-ORDER-01', 'POST /orders requires authentication', isOk, `Status: ${err.response?.status}`);
  }

  try {
    await axios.post(
      `${API_BASE}/orders`,
      { restaurantId: 1, tableId: 1, items: [] },
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );
    record('S6.3-ORDER-02', 'POST /orders validates non-empty items array', false, 'Expected 400');
  } catch (err) {
    const isOk = err.response?.status === 400;
    record('S6.3-ORDER-02', 'POST /orders validates non-empty items array', isOk, `Status: ${err.response?.status}`);
  }

  let createdOrderId = null;
  try {
    const res = await axios.post(
      `${API_BASE}/orders`,
      {
        restaurantId: 1,
        tableId: 1,
        items: [
          { menuItemId: 1, quantity: 2 }, // 2 * 280 = 560
          { menuItemId: 7, quantity: 2 }, // 2 * 70 = 140 -> subtotal = 700, 5% tax = 35, total = 735
        ],
        specialNote: 'Crispy naan please',
      },
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );

    const data = res.data.data;
    const isOk =
      res.status === 201 &&
      data.status === 'received' &&
      data.subtotal === 700 &&
      data.tax === 35 &&
      data.total === 735 &&
      data.items.length === 2;

    createdOrderId = data.id;
    record('S6.3-ORDER-03', 'POST /orders creates order with accurate GST & total', isOk, `Order #${data.id}, Total: ₹${data.total}, Status: ${data.status}`);
  } catch (err) {
    record('S6.3-ORDER-03', 'POST /orders creates order with accurate GST & total', false, err.response?.data?.error?.message || err.message);
  }

  // ── GROUP 3: Order History & Authorization ─────────────────
  try {
    const res = await axios.get(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const found = res.data.data?.some((o) => o.id === createdOrderId);
    record('S6.3-MYORDERS-01', 'GET /orders/my returns customer order history', found, `Total customer orders: ${res.data.data?.length}`);
  } catch (err) {
    record('S6.3-MYORDERS-01', 'GET /orders/my returns customer order history', false, err.message);
  }

  try {
    const res = await axios.get(`${API_BASE}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const isOk = res.status === 200 && res.data.data.id === createdOrderId;
    record('S6.3-ORDERDETAIL-01', 'GET /orders/:id returns full order detail', isOk, `Order #${res.data.data?.id}, Items: ${res.data.data?.items?.length}`);
  } catch (err) {
    record('S6.3-ORDERDETAIL-01', 'GET /orders/:id returns full order detail', false, err.message);
  }

  try {
    // Customer 2 tries to access Customer 1's order
    await axios.get(`${API_BASE}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    record('S6.3-AUTH-ORDER-01', 'Customer cannot access another customer order', false, 'Expected 403');
  } catch (err) {
    const isOk = err.response?.status === 403;
    record('S6.3-AUTH-ORDER-01', 'Customer cannot access another customer order', isOk, `Status: ${err.response?.status}`);
  }

  // ── GROUP 4: Customer Order Cancellation ───────────────────
  let order2Id = null;
  try {
    const res2 = await axios.post(
      `${API_BASE}/orders`,
      {
        restaurantId: 1,
        tableId: 2,
        items: [{ menuItemId: 3, quantity: 1 }],
      },
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );
    order2Id = res2.data.data.id;

    const cancelRes = await axios.patch(
      `${API_BASE}/orders/${order2Id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );

    const isOk = cancelRes.status === 200 && cancelRes.data.data.status === 'cancelled';
    record('S6.3-CANCEL-01', 'PATCH /orders/:id/cancel cancels received order', isOk, `Status: ${cancelRes.data.data?.status}`);
  } catch (err) {
    record('S6.3-CANCEL-01', 'PATCH /orders/:id/cancel cancels received order', false, err.response?.data?.error?.message || err.message);
  }

  // ── GROUP 5: Owner Kitchen Management & Status Workflow ────
  try {
    const res = await axios.get(`${API_BASE}/owner/orders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const isOk = res.status === 200 && Array.isArray(res.data.data);
    record('S6.3-OWNER-01', 'GET /owner/orders returns restaurant kitchen orders', isOk, `Kitchen orders: ${res.data.data?.length}`);
  } catch (err) {
    record('S6.3-OWNER-01', 'GET /owner/orders returns restaurant kitchen orders', false, err.message);
  }

  // Advance createdOrderId through full kitchen workflow: received -> preparing -> served -> completed
  try {
    const pRes = await axios.patch(
      `${API_BASE}/owner/orders/${createdOrderId}/status`,
      { status: 'preparing' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    const isOk = pRes.data.data.status === 'preparing';
    record('S6.3-KDS-01', 'Owner updates order status: received -> preparing', isOk, `Status: ${pRes.data.data?.status}`);
  } catch (err) {
    record('S6.3-KDS-01', 'Owner updates order status: received -> preparing', false, err.response?.data?.error?.message || err.message);
  }

  try {
    const sRes = await axios.patch(
      `${API_BASE}/owner/orders/${createdOrderId}/status`,
      { status: 'served' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    const isOk = sRes.data.data.status === 'served';
    record('S6.3-KDS-02', 'Owner updates order status: preparing -> served', isOk, `Status: ${sRes.data.data?.status}`);
  } catch (err) {
    record('S6.3-KDS-02', 'Owner updates order status: preparing -> served', false, err.response?.data?.error?.message || err.message);
  }

  try {
    const cRes = await axios.patch(
      `${API_BASE}/owner/orders/${createdOrderId}/status`,
      { status: 'completed' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    const isOk = cRes.data.data.status === 'completed';
    record('S6.3-KDS-03', 'Owner updates order status: served -> completed', isOk, `Status: ${cRes.data.data?.status}`);
  } catch (err) {
    record('S6.3-KDS-03', 'Owner updates order status: served -> completed', false, err.response?.data?.error?.message || err.message);
  }

  try {
    // Attempt invalid transition: completed -> preparing
    await axios.patch(
      `${API_BASE}/owner/orders/${createdOrderId}/status`,
      { status: 'preparing' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    record('S6.3-KDS-04', 'Invalid transition rejected after completion', false, 'Expected 400');
  } catch (err) {
    const isOk = err.response?.status === 400;
    record('S6.3-KDS-04', 'Invalid transition rejected after completion', isOk, `Status 400, ${err.response?.data?.error?.code}`);
  }

  // ── GROUP 6: Menu Availability Toggle ──────────────────────
  try {
    const toggleRes = await axios.patch(
      `${API_BASE}/owner/menu/items/1/toggle`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    const isToggled = toggleRes.status === 200 && toggleRes.data.data.is_available === 0;

    // Toggle back to available
    await axios.patch(
      `${API_BASE}/owner/menu/items/1/toggle`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    record('S6.3-TOGGLE-01', 'Owner toggles menu item availability on/off', isToggled, 'Successfully flipped availability and restored');
  } catch (err) {
    record('S6.3-TOGGLE-01', 'Owner toggles menu item availability on/off', false, err.message);
  }

  // ── GROUP 7: Real-Time Socket.IO Order Event Broadcasts ────
  await new Promise((resolve) => {
    let orderCreatedReceived = false;
    let orderStatusReceived = false;

    const custSocket = io(SOCKET_URL, {
      auth: { token: customer1Token },
      transports: ['websocket'],
    });

    custSocket.on('connect', async () => {
      custSocket.on('order:created', (data) => {
        orderCreatedReceived = true;
      });

      custSocket.on('order:status_changed', (data) => {
        orderStatusReceived = true;
      });

      try {
        // Place new order
        const oRes = await axios.post(
          `${API_BASE}/orders`,
          {
            restaurantId: 1,
            tableId: 3,
            items: [{ menuItemId: 8, quantity: 1 }],
          },
          { headers: { Authorization: `Bearer ${customer1Token}` } }
        );

        const newId = oRes.data.data.id;

        // Change status
        await axios.patch(
          `${API_BASE}/owner/orders/${newId}/status`,
          { status: 'preparing' },
          { headers: { Authorization: `Bearer ${ownerToken}` } }
        );

        setTimeout(() => {
          custSocket.disconnect();
          record('S6.3-SOCKET-01', 'Socket receives order:created broadcast', orderCreatedReceived, `Received: ${orderCreatedReceived}`);
          record('S6.3-SOCKET-02', 'Socket receives order:status_changed broadcast', orderStatusReceived, `Received: ${orderStatusReceived}`);
          resolve();
        }, 1200);
      } catch (err) {
        custSocket.disconnect();
        record('S6.3-SOCKET-01', 'Socket receives order:created broadcast', false, err.message);
        record('S6.3-SOCKET-02', 'Socket receives order:status_changed broadcast', false, err.message);
        resolve();
      }
    });

    custSocket.on('connect_error', (err) => {
      record('S6.3-SOCKET-01', 'Socket receives order:created broadcast', false, `Socket connection error: ${err.message}`);
      record('S6.3-SOCKET-02', 'Socket receives order:status_changed broadcast', false, `Socket connection error: ${err.message}`);
      resolve();
    });
  });

  // ── FINAL SUMMARY ──────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`  STAGE 6 PART 3 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${results.length})`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage6Part3Tests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
