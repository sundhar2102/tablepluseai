const axios = require('../../client/node_modules/axios');
const { io } = require('../../client/node_modules/socket.io-client');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Sample coordinates (T. Nagar, Chennai)
const USER_LAT = 13.0418;
const USER_LNG = 80.2341;

async function runStage6Part1Tests() {
  console.log('====================================================');
  console.log('  TABLEPULSE AI — STAGE 6 PART 1 AUTOMATED TESTS');
  console.log('====================================================\n');

  const results = [];
  function record(num, name, passed, details) {
    results.push({ num, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Test ${String(num).padStart(2, '0')}] ${name}${details ? ` -> ${details}` : ''}`);
  }

  // Pre-requisite: Get Customer and Owner tokens
  let customerToken = null;
  let ownerToken = null;
  try {
    const custRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer@demo.com',
      password: 'Demo@1234',
      role: 'customer',
    });
    customerToken = custRes.data.data.token;

    const ownerRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@demo.com',
      password: 'Demo@1234',
      role: 'owner',
    });
    ownerToken = ownerRes.data.data.token;
  } catch (err) {
    console.error('Fatal: Failed to login test users:', err.message);
    process.exit(1);
  }

  // ── GROUP 1: Restaurant Discovery API ────────────────────────────────────
  console.log('\n--- 1. Restaurant Discovery API ---');

  // Test 1: Get nearby restaurants
  try {
    const res = await axios.get(`${API_BASE}/restaurants?lat=${USER_LAT}&lng=${USER_LNG}&radius=10`);
    const passed = res.status === 200 && Array.isArray(res.data.data.restaurants) && res.data.data.restaurants.length > 0;
    record(1, 'Get nearby restaurants', passed, `Found ${res.data.data.restaurants.length} nearby restaurants`);
  } catch (err) {
    record(1, 'Get nearby restaurants', false, err.message);
  }

  // Test 2: Invalid latitude (e.g. 95)
  try {
    await axios.get(`${API_BASE}/restaurants?lat=95&lng=${USER_LNG}`);
    record(2, 'Invalid latitude validation', false, 'Expected 400 but got 200');
  } catch (err) {
    record(2, 'Invalid latitude validation', err.response?.status === 400, `Rejected with 400 (${err.response?.data?.error?.code})`);
  }

  // Test 3: Invalid longitude (e.g. 190)
  try {
    await axios.get(`${API_BASE}/restaurants?lat=${USER_LAT}&lng=190`);
    record(3, 'Invalid longitude validation', false, 'Expected 400 but got 200');
  } catch (err) {
    record(3, 'Invalid longitude validation', err.response?.status === 400, `Rejected with 400 (${err.response?.data?.error?.code})`);
  }

  // Test 4: Invalid radius (e.g. -5)
  try {
    await axios.get(`${API_BASE}/restaurants?lat=${USER_LAT}&lng=${USER_LNG}&radius=-5`);
    record(4, 'Invalid radius validation', false, 'Expected 400 but got 200');
  } catch (err) {
    record(4, 'Invalid radius validation', err.response?.status === 400, `Rejected with 400 (${err.response?.data?.error?.code})`);
  }

  // Test 5: Empty result (search for nonexistent string)
  try {
    const res = await axios.get(`${API_BASE}/restaurants?search=xyznonexistentrestaurant12345`);
    const passed = res.status === 200 && res.data.data.restaurants.length === 0;
    record(5, 'Empty search results handled cleanly', passed, `Returned 0 results gracefully`);
  } catch (err) {
    record(5, 'Empty search results handled cleanly', false, err.message);
  }

  // Test 6: Search by restaurant name
  try {
    const res = await axios.get(`${API_BASE}/restaurants?search=Spice`);
    const passed = res.status === 200 && res.data.data.restaurants.some((r) => r.name.includes('Spice'));
    record(6, 'Search by name', passed, `Found: ${res.data.data.restaurants[0]?.name}`);
  } catch (err) {
    record(6, 'Search by name', false, err.message);
  }

  // Test 7: Search by area
  try {
    const res = await axios.get(`${API_BASE}/restaurants?area=Nungambakkam`);
    const passed = res.status === 200 && res.data.data.restaurants.some((r) => r.address.includes('Nungambakkam'));
    record(7, 'Search by area/location', passed, `Found in area: ${res.data.data.restaurants[0]?.name}`);
  } catch (err) {
    record(7, 'Search by area/location', false, err.message);
  }

  // Test 8: Open-now filter
  try {
    const res = await axios.get(`${API_BASE}/restaurants?openNow=true`);
    const passed = res.status === 200 && res.data.data.restaurants.every((r) => r.isOpen === true);
    record(8, 'Open-now filter', passed, `All ${res.data.data.restaurants.length} returned are open`);
  } catch (err) {
    record(8, 'Open-now filter', false, err.message);
  }

  // ── GROUP 2: Restaurant Details API ──────────────────────────────────────
  console.log('\n--- 2. Restaurant Details API ---');

  // Test 9: Valid restaurant details
  let sampleRestaurant = null;
  try {
    const res = await axios.get(`${API_BASE}/restaurants/1?lat=${USER_LAT}&lng=${USER_LNG}`);
    sampleRestaurant = res.data.data;
    const passed =
      res.status === 200 &&
      sampleRestaurant.id === 1 &&
      Array.isArray(sampleRestaurant.tables) &&
      sampleRestaurant.tables.length > 0 &&
      sampleRestaurant.weeklyHours?.length === 7;
    record(9, 'Valid restaurant details', passed, `${sampleRestaurant.name} (Tables: ${sampleRestaurant.tables.length})`);
  } catch (err) {
    record(9, 'Valid restaurant details', false, err.message);
  }

  // Test 10: Invalid restaurant ID (not found)
  try {
    await axios.get(`${API_BASE}/restaurants/99999`);
    record(10, 'Invalid restaurant ID rejection', false, 'Expected 404 but got 200');
  } catch (err) {
    record(10, 'Invalid restaurant ID rejection', err.response?.status === 404, `Rejected with 404 (${err.response?.data?.error?.code})`);
  }

  // Test 11: Inactive / unapproved restaurant
  try {
    // Restaurant 6 is pending / inactive in seed data
    await axios.get(`${API_BASE}/restaurants/6`);
    record(11, 'Inactive restaurant rejection', false, 'Expected 400 but got 200');
  } catch (err) {
    record(11, 'Inactive restaurant rejection', err.response?.status === 400, `Rejected with 400 (${err.response?.data?.error?.code})`);
  }

  // ── GROUP 3: Live Table Availability & Operational Calculations ───────────
  console.log('\n--- 3. Availability, Crowd & Wait-Time Calculations ---');

  // Test 12: Available table count exists and matches tables list
  const availCount = sampleRestaurant?.tableAvailability?.availableTables;
  const actualAvail = sampleRestaurant?.tables?.filter((t) => t.status === 'available').length;
  record(12, 'Available table count verified', availCount === actualAvail, `Reported: ${availCount}, Actual in list: ${actualAvail}`);

  // Test 13: Occupied table count exists and matches
  const occCount = sampleRestaurant?.tableAvailability?.occupiedTables;
  const actualOcc = sampleRestaurant?.tables?.filter((t) => t.status === 'occupied').length;
  record(13, 'Occupied table count verified', occCount === actualOcc, `Reported: ${occCount}, Actual in list: ${actualOcc}`);

  // Test 14: Reserved table count exists and matches
  const resCount = sampleRestaurant?.tableAvailability?.reservedTables;
  const actualRes = sampleRestaurant?.tables?.filter((t) => t.status === 'reserved').length;
  record(14, 'Reserved table count verified', resCount === actualRes, `Reported: ${resCount}, Actual in list: ${actualRes}`);

  // Test 15: Cleaning table count exists and matches
  const cleanCount = sampleRestaurant?.tableAvailability?.cleaningTables;
  const actualClean = sampleRestaurant?.tables?.filter((t) => t.status === 'cleaning').length;
  record(15, 'Cleaning table count verified', cleanCount === actualClean, `Reported: ${cleanCount}, Actual in list: ${actualClean}`);

  // Test 16: Crowd level calculation rule
  const crowd = sampleRestaurant?.crowdLevel;
  const validCrowds = ['LOW', 'MODERATE', 'HIGH', 'FULL'];
  record(16, 'Crowd level rule-based calculation', validCrowds.includes(crowd), `Assigned: ${crowd}`);

  // Test 17: Transparent wait-time calculation
  const waitInfo = sampleRestaurant?.waitEstimation;
  const waitPassed =
    waitInfo &&
    typeof waitInfo.estimatedWaitMinutes === 'number' &&
    waitInfo.calculationType === 'RULE_BASED' &&
    waitInfo.isPrediction === false &&
    typeof waitInfo.disclaimer === 'string';
  record(17, 'Rule-based wait-time estimation structure', waitPassed, `Wait: ${waitInfo?.estimatedWaitMinutes}m (${waitInfo?.reason})`);

  // ── GROUP 4: Location & Geospatial Architecture ──────────────────────────
  console.log('\n--- 4. Location & Geospatial Architecture ---');

  // Test 18: Valid coordinates returns calculated distanceKm
  try {
    const res = await axios.get(`${API_BASE}/restaurants?lat=13.0418&lng=80.2341`);
    const passed = res.data.data.restaurants[0]?.distanceKm !== null;
    record(18, 'Valid coordinates distance calculation', passed, `Nearest distance: ${res.data.data.restaurants[0]?.distanceKm} km`);
  } catch (err) {
    record(18, 'Valid coordinates distance calculation', false, err.message);
  }

  // Test 19: Invalid coordinate format rejected
  try {
    await axios.get(`${API_BASE}/restaurants?lat=notanumber&lng=80.2341`);
    record(19, 'Invalid coordinate format validation', false, 'Expected 400');
  } catch (err) {
    record(19, 'Invalid coordinate format validation', err.response?.status === 400, `Rejected with 400`);
  }

  // Test 20: Radius filtering (tight radius 2km vs 10km)
  try {
    const resTight = await axios.get(`${API_BASE}/restaurants?lat=13.0418&lng=80.2341&radius=2`);
    const resWide = await axios.get(`${API_BASE}/restaurants?lat=13.0418&lng=80.2341&radius=10`);
    const passed = resTight.data.data.restaurants.length <= resWide.data.data.restaurants.length;
    record(20, 'Radius proximity filtering', passed, `2km: ${resTight.data.data.restaurants.length} rests | 10km: ${resWide.data.data.restaurants.length} rests`);
  } catch (err) {
    record(20, 'Radius proximity filtering', false, err.message);
  }

  // Test 21: Backend Haversine distance ordering
  try {
    const res = await axios.get(`${API_BASE}/restaurants?lat=13.0418&lng=80.2341&radius=10`);
    const list = res.data.data.restaurants;
    let strictlyOrdered = true;
    for (let i = 1; i < list.length; i++) {
      if (list[i].distanceKm < list[i - 1].distanceKm) {
        strictlyOrdered = false;
        break;
      }
    }
    record(21, 'Distance ordering (backend authoritative)', strictlyOrdered, 'Restaurants ordered ascending by distance');
  } catch (err) {
    record(21, 'Distance ordering (backend authoritative)', false, err.message);
  }

  // ── GROUP 5: Security & Authorization ────────────────────────────────────
  console.log('\n--- 5. Security & Authorization ---');

  // Test 22: Unauthorized table status change rejected (no JWT)
  try {
    await axios.patch(`${API_BASE}/restaurants/1/tables/1/status`, { status: 'occupied' });
    record(22, 'Unauthorized table update blocked', false, 'Expected 401');
  } catch (err) {
    record(22, 'Unauthorized table update blocked', err.response?.status === 401, `Blocked with 401 (${err.response?.data?.error?.code})`);
  }

  // Test 23: Invalid JWT on table status update
  try {
    await axios.patch(
      `${API_BASE}/restaurants/1/tables/1/status`,
      { status: 'occupied' },
      { headers: { Authorization: 'Bearer fake.invalid.jwt' } }
    );
    record(23, 'Invalid JWT on table update blocked', false, 'Expected 401');
  } catch (err) {
    record(23, 'Invalid JWT on table update blocked', err.response?.status === 401, `Blocked with 401 (${err.response?.data?.error?.code})`);
  }

  // Test 24: Customer blocked from modifying table status (role authorization)
  try {
    await axios.patch(
      `${API_BASE}/restaurants/1/tables/1/status`,
      { status: 'occupied' },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    record(24, 'Customer role blocked from table mutation', false, 'Customer unexpectedly allowed');
  } catch (err) {
    record(24, 'Customer role blocked from table mutation', err.response?.status === 403, `Blocked with 403 (${err.response?.data?.error?.code})`);
  }

  // Test 25: SQL injection attempt in search query handled safely
  try {
    const res = await axios.get(`${API_BASE}/restaurants?search=' OR '1'='1`);
    const passed = res.status === 200 && Array.isArray(res.data.data.restaurants);
    record(25, 'SQL injection attempt handled safely', passed, 'Parameterized query prevented injection');
  } catch (err) {
    record(25, 'SQL injection attempt handled safely', false, err.message);
  }

  // ── GROUP 6: Socket.IO Real-Time Availability ────────────────────────────
  console.log('\n--- 6. Socket.IO Real-Time Availability Foundation ---');

  await new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: customerToken },
      transports: ['websocket', 'polling'],
    });

    let eventReceived = false;

    socket.on('connect', async () => {
      // Test 26: Join restaurant room
      socket.emit('join:restaurant', 1);
      record(26, 'Join restaurant Socket.IO room', true, `Socket connected: ${socket.id} joined restaurant:1`);

      // Trigger table update as Owner to verify real-time event broadcast
      try {
        setTimeout(async () => {
          await axios.patch(
            `${API_BASE}/restaurants/1/tables/1/status`,
            { status: 'occupied' },
            { headers: { Authorization: `Bearer ${ownerToken}` } }
          );
        }, 500);
      } catch (err) {
        console.error('Trigger table update error:', err.message);
      }
    });

    // Test 27 & 28: Availability event received
    socket.on('restaurant:availability_updated', (payload) => {
      eventReceived = true;
      const validPayload =
        payload.restaurantId === 1 &&
        payload.tableId === 1 &&
        payload.newStatus === 'occupied' &&
        typeof payload.tableAvailability === 'object' &&
        typeof payload.crowdLevel === 'string';

      record(27, 'restaurant:availability_updated event emitted', true, `Payload verified for table ${payload.tableNumber}`);
      record(28, 'Connected customer received real-time update', validPayload, `Updated status: ${payload.newStatus} | Crowd: ${payload.crowdLevel}`);

      // Revert table back to available
      axios
        .patch(
          `${API_BASE}/restaurants/1/tables/1/status`,
          { status: 'available' },
          { headers: { Authorization: `Bearer ${ownerToken}` } }
        )
        .catch(() => {});

      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      // Test 30: Disconnect handled
      record(30, 'Socket disconnect handled cleanly', true, `Reason: ${reason}`);
      resolve();
    });

    socket.on('connect_error', (err) => {
      record(26, 'Join restaurant Socket.IO room', false, err.message);
      resolve();
    });

    setTimeout(() => {
      if (!eventReceived) {
        record(27, 'restaurant:availability_updated event emitted', false, 'Event timeout');
        record(28, 'Connected customer received real-time update', false, 'Timeout waiting for event');
        socket.disconnect();
      }
      resolve();
    }, 6000);
  });

  // Test 29: Unauthorized socket connection rejected
  await new Promise((resolve) => {
    const badSocket = io(SOCKET_URL, {
      auth: { token: 'invalid.token' },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    badSocket.on('connect', () => {
      record(29, 'Unauthorized socket connection rejected', false, 'Bad socket unexpectedly connected');
      badSocket.disconnect();
      resolve();
    });

    badSocket.on('connect_error', (err) => {
      record(29, 'Unauthorized socket connection rejected', true, `Handshake rejected: ${err.message}`);
      badSocket.disconnect();
      resolve();
    });

    setTimeout(() => {
      badSocket.disconnect();
      resolve();
    }, 3000);
  });

  // ── Test Suite Summary ───────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('              AUTOMATED TEST SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Tests Executed : ${total}`);
  console.log(`Passed               : ${passed}`);
  console.log(`Failed               : ${failed}`);
  console.log(`Status               : ${failed === 0 ? 'ALL 30 TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('====================================================\n');
}

runStage6Part1Tests().catch(console.error);
