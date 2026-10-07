const axios = require('../../client/node_modules/axios');
const { io } = require('../../client/node_modules/socket.io-client');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function runStage6Part2Tests() {
  console.log('\n====================================================');
  console.log('  TABLEPULSE AI — STAGE 6 PART 2 AUTOMATED TESTS');
  console.log('  RESERVATIONS & VIRTUAL WALK-IN QUEUE VERIFICATION');
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
    const c1Res = await axios.post(`${API_BASE}/auth/login`, {
      email: c1Email,
      password: 'Password123!',
      role: 'customer',
    });
    customer1Token = c1Res.data.data.token;
    customer1Id = c1Res.data.data.user.id;

    // Register Customer 2
    const c2Email = `cust2_${rand}@example.com`;
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'Customer Two',
      email: c2Email,
      phone: '+91 9123456780',
      password: 'Password123!',
      role: 'customer',
    });
    const c2Res = await axios.post(`${API_BASE}/auth/login`, {
      email: c2Email,
      password: 'Password123!',
      role: 'customer',
    });
    customer2Token = c2Res.data.data.token;
    customer2Id = c2Res.data.data.user.id;

    // Login Owner
    const oRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@demo.com',
      password: 'Demo@1234',
      role: 'owner',
    });
    ownerToken = oRes.data.data.token;
    ownerRestaurantId = oRes.data.data.user.restaurantId || 1;
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const cust1Headers = { Authorization: `Bearer ${customer1Token}` };
  const cust2Headers = { Authorization: `Bearer ${customer2Token}` };
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  const { pool } = require('../../server/src/config/db');

  // Future date for reservations
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 5);
  const validDateStr = targetDate.toISOString().split('T')[0];
  const validTimeStr = '19:30';

  // Reset test tables to clean state
  await pool.query("UPDATE walk_in_queue SET status = 'cancelled' WHERE status IN ('waiting', 'called')");
  await pool.query("DELETE FROM reservations WHERE reservation_date = ?", [validDateStr]);

  let createdReservationId = null;
  let createdQueueId = null;

  console.log('--- 1. Table Reservation Creation & Validation ---');

  // Test 01: Valid reservation creation
  try {
    const res = await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: validDateStr,
        reservationTime: validTimeStr,
        partySize: 2,
        specialNote: 'Quiet table preferred',
      },
      { headers: cust1Headers }
    );
    createdReservationId = res.data.data.id;
    record(
      'Test 01',
      'Valid table reservation creation',
      res.status === 201 && res.data.success && res.data.data.status === 'pending',
      `Booking #${createdReservationId} created, status: ${res.data.data.status}`
    );
  } catch (err) {
    record('Test 01', 'Valid table reservation creation', false, err.response?.data?.error?.message || err.message);
  }

  // Test 02: Invalid restaurant rejection
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: 999999,
        reservationDate: validDateStr,
        reservationTime: validTimeStr,
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    record('Test 02', 'Invalid restaurant rejection', false, 'Expected 404');
  } catch (err) {
    record(
      'Test 02',
      'Invalid restaurant rejection',
      err.response?.status === 404,
      `Rejected with ${err.response?.status} (${err.response?.data?.error?.code})`
    );
  }

  // Test 03: Inactive restaurant rejection
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: 6, // Inactive restaurant from seed
        reservationDate: validDateStr,
        reservationTime: validTimeStr,
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    record('Test 03', 'Inactive restaurant rejection', false, 'Expected 400');
  } catch (err) {
    record(
      'Test 03',
      'Inactive restaurant rejection',
      err.response?.status === 400 && err.response?.data?.error?.code === 'RESTAURANT_INACTIVE',
      `Rejected with 400 (${err.response?.data?.error?.code})`
    );
  }

  // Test 04: Invalid past date rejection
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: '2020-01-01',
        reservationTime: validTimeStr,
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    record('Test 04', 'Invalid past date rejection', false, 'Expected 400');
  } catch (err) {
    record(
      'Test 04',
      'Invalid past date rejection',
      err.response?.status === 400,
      `Rejected with ${err.response?.status} (${err.response?.data?.error?.code || 'VALIDATION_ERROR'})`
    );
  }

  // Test 05: Invalid time rejection
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: validDateStr,
        reservationTime: '25:99',
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    record('Test 05', 'Invalid time format rejection', false, 'Expected 400');
  } catch (err) {
    record(
      'Test 05',
      'Invalid time format rejection',
      err.response?.status === 400,
      `Rejected with 400 (${err.response?.data?.error?.code})`
    );
  }

  // Test 06: Invalid party size rejection
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: validDateStr,
        reservationTime: validTimeStr,
        partySize: 0,
      },
      { headers: cust1Headers }
    );
    record('Test 06', 'Invalid party size rejection (0 guests)', false, 'Expected 400');
  } catch (err) {
    record(
      'Test 06',
      'Invalid party size rejection (0 guests)',
      err.response?.status === 400,
      `Rejected with 400 (${err.response?.data?.error?.code})`
    );
  }

  // Test 07: Duplicate booking prevention (same customer, restaurant, date, and overlapping slot)
  try {
    await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: validDateStr,
        reservationTime: validTimeStr,
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    record('Test 07', 'Duplicate booking prevention', false, 'Expected 409 conflict');
  } catch (err) {
    record(
      'Test 07',
      'Duplicate booking prevention',
      err.response?.status === 409 && err.response?.data?.error?.code === 'DUPLICATE_RESERVATION',
      `Blocked with 409 (${err.response?.data?.error?.code})`
    );
  }

  console.log('\n--- 2. Reservation Retrieval & Customer Authorization ---');

  // Test 08: Customer retrieves their reservations
  try {
    const res = await axios.get(`${API_BASE}/reservations`, { headers: cust1Headers });
    const found = res.data.data.some((r) => r.id === createdReservationId);
    record(
      'Test 08',
      'Customer retrieves their reservations',
      res.status === 200 && found,
      `Found ${res.data.data.length} reservations for customer`
    );
  } catch (err) {
    record('Test 08', 'Customer retrieves their reservations', false, err.response?.data?.error?.message || err.message);
  }

  // Test 09: Customer retrieves single reservation by ID
  try {
    const res = await axios.get(`${API_BASE}/reservations/${createdReservationId}`, { headers: cust1Headers });
    record(
      'Test 09',
      'Customer retrieves single reservation by ID',
      res.status === 200 && res.data.data.id === createdReservationId,
      `Booking verified: ${res.data.data.restaurantName} on ${res.data.data.reservationDate}`
    );
  } catch (err) {
    record('Test 09', 'Customer retrieves single reservation by ID', false, err.response?.data?.error?.message || err.message);
  }

  // Test 10: Unauthorized customer cannot access another customer\'s reservation
  try {
    await axios.get(`${API_BASE}/reservations/${createdReservationId}`, { headers: cust2Headers });
    record('Test 10', 'Cross-customer reservation isolation', false, 'Expected 403 Forbidden');
  } catch (err) {
    record(
      'Test 10',
      'Cross-customer reservation isolation',
      err.response?.status === 403 && err.response?.data?.error?.code === 'FORBIDDEN',
      `Blocked with 403 (${err.response?.data?.error?.code})`
    );
  }

  // Test 11: Customer cancels their reservation
  try {
    const res = await axios.patch(
      `${API_BASE}/reservations/${createdReservationId}/cancel`,
      { cancellationReason: 'Change of plans' },
      { headers: cust1Headers }
    );
    record(
      'Test 11',
      'Customer cancels their reservation',
      res.status === 200 && res.data.data.status === 'cancelled',
      `Reservation #${createdReservationId} cancelled successfully`
    );
  } catch (err) {
    record('Test 11', 'Customer cancels their reservation', false, err.response?.data?.error?.message || err.message);
  }

  // Test 12: Cannot cancel an already cancelled reservation
  try {
    await axios.patch(
      `${API_BASE}/reservations/${createdReservationId}/cancel`,
      { cancellationReason: 'Trying to cancel again' },
      { headers: cust1Headers }
    );
    record('Test 12', 'Cannot re-cancel already cancelled reservation', false, 'Expected 400 Bad Request');
  } catch (err) {
    record(
      'Test 12',
      'Cannot re-cancel already cancelled reservation',
      err.response?.status === 400 && err.response?.data?.error?.code === 'INVALID_STATUS',
      `Blocked with 400 (${err.response?.data?.error?.code})`
    );
  }

  console.log('\n--- 3. Owner Reservation Management & Lifecycle ---');

  // Create a new reservation to test Owner confirmation & completion
  let secondResId = null;
  try {
    const res = await axios.post(
      `${API_BASE}/reservations`,
      {
        restaurantId: ownerRestaurantId,
        reservationDate: validDateStr,
        reservationTime: '20:00',
        partySize: 4,
        specialNote: 'Window seating',
      },
      { headers: cust1Headers }
    );
    secondResId = res.data.data.id;
  } catch (err) {
    console.error('Failed to create second reservation for owner tests:', err.message);
  }

  // Test 13: Owner views restaurant reservations
  try {
    const res = await axios.get(`${API_BASE}/owner/reservations`, { headers: ownerHeaders });
    const found = res.data.data.reservations.some((r) => r.id === secondResId);
    record(
      'Test 13',
      'Owner views restaurant reservations',
      res.status === 200 && found,
      `Owner retrieved ${res.data.data.reservations.length} reservations`
    );
  } catch (err) {
    record('Test 13', 'Owner views restaurant reservations', false, err.response?.data?.error?.message || err.message);
  }

  // Test 14: Customer role blocked from owner reservations endpoint
  try {
    await axios.get(`${API_BASE}/owner/reservations`, { headers: cust1Headers });
    record('Test 14', 'Customer blocked from owner reservations endpoint', false, 'Expected 403');
  } catch (err) {
    record(
      'Test 14',
      'Customer blocked from owner reservations endpoint',
      err.response?.status === 403,
      `Blocked with 403 (${err.response?.data?.error?.code})`
    );
  }

  // Test 15: Owner confirms pending reservation
  try {
    const res = await axios.patch(
      `${API_BASE}/owner/reservations/${secondResId}/status`,
      { status: 'confirmed' },
      { headers: ownerHeaders }
    );
    record(
      'Test 15',
      'Owner confirms pending reservation',
      res.status === 200 && res.data.data.status === 'confirmed',
      `Booking #${secondResId} confirmed`
    );
  } catch (err) {
    record('Test 15', 'Owner confirms pending reservation', false, err.response?.data?.error?.message || err.message);
  }

  // Test 16: Owner completes confirmed reservation
  try {
    const res = await axios.patch(
      `${API_BASE}/owner/reservations/${secondResId}/status`,
      { status: 'completed' },
      { headers: ownerHeaders }
    );
    record(
      'Test 16',
      'Owner completes confirmed reservation',
      res.status === 200 && res.data.data.status === 'completed',
      `Booking #${secondResId} completed`
    );
  } catch (err) {
    record('Test 16', 'Owner completes confirmed reservation', false, err.response?.data?.error?.message || err.message);
  }

  console.log('\n--- 4. Virtual Walk-In Queue Backend ---');

  // Test 17: Customer joins virtual walk-in queue
  try {
    const res = await axios.post(
      `${API_BASE}/queue`,
      {
        restaurantId: ownerRestaurantId,
        partySize: 2,
      },
      { headers: cust1Headers }
    );
    createdQueueId = res.data.data.id;
    record(
      'Test 17',
      'Customer joins virtual walk-in queue',
      res.status === 201 && res.data.data.queuePosition >= 1 && res.data.data.status === 'waiting',
      `Queue entry #${createdQueueId}, position #${res.data.data.queuePosition}`
    );
  } catch (err) {
    record('Test 17', 'Customer joins virtual walk-in queue', false, err.response?.data?.error?.message || err.message);
  }

  // Test 18: Queue wait time is transparently rule-based (RULE_BASED, not AI)
  try {
    const res = await axios.get(`${API_BASE}/queue/${createdQueueId}`, { headers: cust1Headers });
    const waitEst = res.data.data.waitEstimation;
    const isRuleBased =
      waitEst &&
      waitEst.calculationType === 'RULE_BASED' &&
      waitEst.isPrediction === false &&
      typeof waitEst.estimatedWaitMinutes === 'number';

    record(
      'Test 18',
      'Queue wait time transparently labeled RULE_BASED',
      isRuleBased,
      `Type: ${waitEst?.calculationType} | Wait: ~${waitEst?.estimatedWaitMinutes}m (Not AI)`
    );
  } catch (err) {
    record('Test 18', 'Queue wait time transparently labeled RULE_BASED', false, err.response?.data?.error?.message || err.message);
  }

  // Test 19: Duplicate queue entry prevention (customer cannot join twice while active)
  try {
    await axios.post(
      `${API_BASE}/queue`,
      {
        restaurantId: ownerRestaurantId,
        partySize: 4,
      },
      { headers: cust1Headers }
    );
    record('Test 19', 'Duplicate queue entry prevention', false, 'Expected 409 Conflict');
  } catch (err) {
    record(
      'Test 19',
      'Duplicate queue entry prevention',
      err.response?.status === 409 && err.response?.data?.error?.code === 'DUPLICATE_QUEUE_ENTRY',
      `Blocked with 409 (${err.response?.data?.error?.code})`
    );
  }

  // Test 20: Second customer joins and receives dynamic next queue position
  let secondQueueId = null;
  try {
    const res = await axios.post(
      `${API_BASE}/queue`,
      {
        restaurantId: ownerRestaurantId,
        partySize: 3,
      },
      { headers: cust2Headers }
    );
    secondQueueId = res.data.data.id;
    record(
      'Test 20',
      'Second customer joins with sequential queue position',
      res.status === 201 && res.data.data.queuePosition === 2,
      `Second customer assigned position #${res.data.data.queuePosition}`
    );
  } catch (err) {
    record('Test 20', 'Second customer joins with sequential queue position', false, err.response?.data?.error?.message || err.message);
  }

  // Test 21: Cross-customer queue isolation
  try {
    await axios.get(`${API_BASE}/queue/${createdQueueId}`, { headers: cust2Headers });
    record('Test 21', 'Cross-customer queue entry privacy isolation', false, 'Expected 403 Forbidden');
  } catch (err) {
    record(
      'Test 21',
      'Cross-customer queue entry privacy isolation',
      err.response?.status === 403 && err.response?.data?.error?.code === 'FORBIDDEN',
      `Blocked with 403 (${err.response?.data?.error?.code})`
    );
  }

  console.log('\n--- 5. Owner Queue Management & Seating Lifecycle ---');

  // Test 22: Owner views live restaurant queue
  try {
    const res = await axios.get(`${API_BASE}/owner/queue`, { headers: ownerHeaders });
    const hasWaiting = res.data.data.totalWaiting >= 2;
    record(
      'Test 22',
      'Owner views live restaurant queue with privacy masking',
      res.status === 200 && hasWaiting,
      `Total waiting: ${res.data.data.totalWaiting} | Masked phone: ${res.data.data.queue[0]?.customerPhone}`
    );
  } catch (err) {
    record('Test 22', 'Owner views live restaurant queue', false, err.response?.data?.error?.message || err.message);
  }

  // Test 23: Owner calls first customer in queue
  try {
    const res = await axios.patch(
      `${API_BASE}/owner/queue/${createdQueueId}/status`,
      { status: 'called' },
      { headers: ownerHeaders }
    );
    record(
      'Test 23',
      'Owner calls customer (notifies)',
      res.status === 200 && res.data.data.status === 'called',
      `Queue #${createdQueueId} status is now 'called'`
    );
  } catch (err) {
    record('Test 23', 'Owner calls customer (notifies)', false, err.response?.data?.error?.message || err.message);
  }

  // Test 24: Owner seats called customer
  try {
    const res = await axios.patch(
      `${API_BASE}/owner/queue/${createdQueueId}/status`,
      { status: 'seated' },
      { headers: ownerHeaders }
    );
    record(
      'Test 24',
      'Owner seats customer at dining table',
      res.status === 200 && res.data.data.status === 'seated',
      `Queue #${createdQueueId} marked as 'seated'`
    );
  } catch (err) {
    record('Test 24', 'Owner seats customer at dining table', false, err.response?.data?.error?.message || err.message);
  }

  // Test 25: Dynamic queue position update (subsequent parties move up!)
  try {
    const res = await axios.get(`${API_BASE}/queue/${secondQueueId}`, { headers: cust2Headers });
    const newPosition = res.data.data.queuePosition;
    record(
      'Test 25',
      'Subsequent party moves forward when party ahead is seated',
      newPosition === 1,
      `Customer 2 moved from #2 to #${newPosition}`
    );
  } catch (err) {
    record('Test 25', 'Subsequent party moves forward', false, err.response?.data?.error?.message || err.message);
  }

  // Test 26: Customer 2 leaves / cancels queue
  try {
    const res = await axios.patch(`${API_BASE}/queue/${secondQueueId}/cancel`, {}, { headers: cust2Headers });
    record(
      'Test 26',
      'Customer cancels queue entry',
      res.status === 200 && res.data.data.status === 'cancelled',
      `Queue #${secondQueueId} cancelled`
    );
  } catch (err) {
    record('Test 26', 'Customer cancels queue entry', false, err.response?.data?.error?.message || err.message);
  }

  console.log('\n--- 6. Socket.IO Real-Time Synchronization ---');

  // Test 27: Socket.IO client connects with customer JWT
  let socketClient = null;
  let socketConnected = false;
  try {
    socketClient = io(SOCKET_URL, {
      auth: { token: customer1Token },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
      socketClient.on('connect', () => {
        socketConnected = true;
        clearTimeout(timeout);
        resolve();
      });
      socketClient.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    record('Test 27', 'Socket.IO client authenticated connection', socketConnected, `Connected with ID: ${socketClient.id}`);
  } catch (err) {
    record('Test 27', 'Socket.IO client authenticated connection', false, err.message);
  }

  // Test 28: Real-time reservation event broadcast
  let reservationEventReceived = false;
  if (socketClient && socketConnected) {
    try {
      socketClient.emit('join:restaurant', ownerRestaurantId);

      const eventPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        socketClient.on('reservation:created', (payload) => {
          if (payload.restaurantId === ownerRestaurantId) {
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });

      // Trigger creation via API
      await axios.post(
        `${API_BASE}/reservations`,
        {
          restaurantId: ownerRestaurantId,
          reservationDate: validDateStr,
          reservationTime: '21:00',
          partySize: 2,
        },
        { headers: cust2Headers }
      );

      reservationEventReceived = await eventPromise;
      record(
        'Test 28',
        'Real-time reservation:created event broadcast',
        reservationEventReceived,
        'Socket received reservation:created event in restaurant room'
      );
    } catch (err) {
      record('Test 28', 'Real-time reservation:created event broadcast', false, err.message);
    }
  } else {
    record('Test 28', 'Real-time reservation:created event broadcast', false, 'Socket not connected');
  }

  // Test 29: Real-time queue event broadcast
  let queueEventReceived = false;
  if (socketClient && socketConnected) {
    try {
      const queueEventPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        socketClient.on('queue:joined', (payload) => {
          if (payload.restaurantId === ownerRestaurantId) {
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });

      await axios.post(
        `${API_BASE}/queue`,
        {
          restaurantId: ownerRestaurantId,
          partySize: 2,
        },
        { headers: cust2Headers }
      );

      queueEventReceived = await queueEventPromise;
      record(
        'Test 29',
        'Real-time queue:joined event broadcast',
        queueEventReceived,
        'Socket received queue:joined event in restaurant room'
      );
    } catch (err) {
      record('Test 29', 'Real-time queue:joined event broadcast', false, err.message);
    }
  } else {
    record('Test 29', 'Real-time queue:joined event broadcast', false, 'Socket not connected');
  }

  // Test 30: Socket disconnect handled cleanly
  if (socketClient) {
    socketClient.disconnect();
    record('Test 30', 'Socket disconnect handled cleanly', !socketClient.connected, 'Disconnected cleanly');
  }

  // ── Summary Report ──────────────────────────────────────────
  console.log('\n====================================================');
  console.log('              AUTOMATED TEST SUMMARY');
  console.log('====================================================');
  console.log(`Total Tests Executed : ${results.length}`);
  console.log(`Passed               : ${passedCount}`);
  console.log(`Failed               : ${failedCount}`);
  console.log(`Status               : ${failedCount === 0 ? 'ALL 30 TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage6Part2Tests();
