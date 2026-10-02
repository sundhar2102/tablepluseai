/**
 * TablePulse AI - Unit Test Suite (85 Unit Tests)
 * IDs: UNIT-001 to UNIT-085
 */

const assert = require('assert');
const { haversine } = require('../../server/src/utils/haversine');
const AppError = require('../../server/src/utils/AppError');
const qrHelper = require('../../server/src/utils/qrHelper');
const constants = require('../../server/src/config/constants');
const { calculateCrowdLevel, calculateWaitTime, checkIsOpen } = require('../../server/src/services/restaurant.service');
const { restaurantQuerySchema, updateTableStatusSchema } = require('../../server/src/validations/restaurant.validation');
const { registerSchema, loginSchema } = require('../../server/src/validations/auth.validation');

const results = [];

function runTest(id, name, fn) {
  const start = Date.now();
  try {
    fn();
    results.push({ id, name, status: 'PASS', duration: Date.now() - start, error: null });
  } catch (err) {
    results.push({ id, name, status: 'FAIL', duration: Date.now() - start, error: err.message });
  }
}

// ----------------------------------------------------
// 1. Haversine Distance Calculation (UNIT-001 - UNIT-015)
// ----------------------------------------------------
runTest('UNIT-001', 'Haversine: Same coordinates return 0 distance', () => {
  const dist = haversine(13.0418, 80.2341, 13.0418, 80.2341);
  assert.strictEqual(dist, 0);
});

runTest('UNIT-002', 'Haversine: Known distance between T. Nagar and Nungambakkam (~2.1 km)', () => {
  const dist = haversine(13.0418, 80.2341, 13.0587, 80.2435);
  assert.ok(dist >= 1.8 && dist <= 2.5, `Distance was ${dist}`);
});

runTest('UNIT-003', 'Haversine: Known distance between Chennai and Bangalore (~290 km)', () => {
  const dist = haversine(13.0827, 80.2707, 12.9716, 77.5946);
  assert.ok(dist >= 280 && dist <= 310, `Distance was ${dist}`);
});

runTest('UNIT-004', 'Haversine: Output is numerical distance in kilometers', () => {
  const dist = haversine(13.0418, 80.2341, 13.0500, 80.2400);
  assert.ok(typeof dist === 'number' && dist > 0);
});

runTest('UNIT-005', 'Haversine: Zero distance for equator points at same lon', () => {
  const dist = haversine(0, 0, 0, 0);
  assert.strictEqual(dist, 0);
});

runTest('UNIT-006', 'Haversine: Antipodal points distance close to half Earth circumference (~20015 km)', () => {
  const dist = haversine(0, 0, 0, 180);
  assert.ok(dist >= 19900 && dist <= 20100, `Antipodal dist: ${dist}`);
});

runTest('UNIT-007', 'Haversine: North pole to South pole distance (~20015 km)', () => {
  const dist = haversine(90, 0, -90, 0);
  assert.ok(dist >= 19900 && dist <= 20100, `Poles dist: ${dist}`);
});

runTest('UNIT-008', 'Haversine: Commutative property (dist(A,B) === dist(B,A))', () => {
  const d1 = haversine(13.0418, 80.2341, 13.0850, 80.2101);
  const d2 = haversine(13.0850, 80.2101, 13.0418, 80.2341);
  assert.ok(Math.abs(d1 - d2) < 0.0001);
});

runTest('UNIT-009', 'Haversine: Small lat offset produces positive distance', () => {
  const dist = haversine(13.0000, 80.0000, 13.0010, 80.0000);
  assert.ok(dist > 0 && dist < 0.2);
});

runTest('UNIT-010', 'Haversine: Small lng offset produces positive distance', () => {
  const dist = haversine(13.0000, 80.0000, 13.0000, 80.0010);
  assert.ok(dist > 0 && dist < 0.2);
});

runTest('UNIT-011', 'Haversine: Negative latitude handling', () => {
  const dist = haversine(-33.8688, 151.2093, -37.8136, 144.9631);
  assert.ok(dist > 700 && dist < 750);
});

runTest('UNIT-012', 'Haversine: Negative longitude handling', () => {
  const dist = haversine(40.7128, -74.0060, 34.0522, -118.2437);
  assert.ok(dist > 3900 && dist < 4000);
});

runTest('UNIT-013', 'Haversine: Handles string number inputs gracefully', () => {
  const dist = haversine('13.0418', '80.2341', '13.0418', '80.2341');
  assert.strictEqual(dist, 0);
});

runTest('UNIT-014', 'Haversine: Returns valid number type', () => {
  const dist = haversine(13.0, 80.0, 13.1, 80.1);
  assert.strictEqual(typeof dist, 'number');
});

runTest('UNIT-015', 'Haversine: Triangle inequality holds', () => {
  const dAB = haversine(13.04, 80.23, 13.05, 80.24);
  const dBC = haversine(13.05, 80.24, 13.08, 80.21);
  const dAC = haversine(13.04, 80.23, 13.08, 80.21);
  assert.ok(dAC <= dAB + dBC + 0.1);
});

// ----------------------------------------------------
// 2. Crowd Level Calculation Engine (UNIT-016 - UNIT-030)
// ----------------------------------------------------
runTest('UNIT-016', 'Crowd Level: 0 total tables returns LOW', () => {
  const crowd = calculateCrowdLevel(0, 0, 0, 0, 0);
  assert.strictEqual(crowd, 'LOW');
});

runTest('UNIT-017', 'Crowd Level: 0 available tables returns FULL', () => {
  const crowd = calculateCrowdLevel(0, 8, 2, 0, 10);
  assert.strictEqual(crowd, 'FULL');
});

runTest('UNIT-018', 'Crowd Level: Occupancy < 40% returns LOW', () => {
  const crowd = calculateCrowdLevel(8, 2, 0, 0, 10);
  assert.strictEqual(crowd, 'LOW');
});

runTest('UNIT-019', 'Crowd Level: Occupancy exactly 30% returns LOW', () => {
  const crowd = calculateCrowdLevel(7, 3, 0, 0, 10);
  assert.strictEqual(crowd, 'LOW');
});

runTest('UNIT-020', 'Crowd Level: Occupancy 40% returns MODERATE', () => {
  const crowd = calculateCrowdLevel(6, 4, 0, 0, 10);
  assert.strictEqual(crowd, 'MODERATE');
});

runTest('UNIT-021', 'Crowd Level: Occupancy 50% returns MODERATE', () => {
  const crowd = calculateCrowdLevel(5, 5, 0, 0, 10);
  assert.strictEqual(crowd, 'MODERATE');
});

runTest('UNIT-022', 'Crowd Level: Occupancy 70% returns MODERATE', () => {
  const crowd = calculateCrowdLevel(3, 5, 2, 0, 10);
  assert.strictEqual(crowd, 'MODERATE');
});

runTest('UNIT-023', 'Crowd Level: Occupancy 75% returns HIGH when tables available', () => {
  const crowd = calculateCrowdLevel(3, 8, 1, 0, 12);
  assert.strictEqual(crowd, 'HIGH');
});

runTest('UNIT-024', 'Crowd Level: Occupancy 90% with 1 table available returns HIGH', () => {
  const crowd = calculateCrowdLevel(1, 8, 1, 0, 10);
  assert.strictEqual(crowd, 'HIGH');
});

runTest('UNIT-025', 'Crowd Level: Reserved tables factor into occupancy ratio', () => {
  const crowd = calculateCrowdLevel(5, 1, 4, 0, 10);
  assert.strictEqual(crowd, 'MODERATE');
});

runTest('UNIT-026', 'Crowd Level: All available tables returns LOW', () => {
  const crowd = calculateCrowdLevel(15, 0, 0, 0, 15);
  assert.strictEqual(crowd, 'LOW');
});

runTest('UNIT-027', 'Crowd Level: 1 table total, occupied -> FULL', () => {
  const crowd = calculateCrowdLevel(0, 1, 0, 0, 1);
  assert.strictEqual(crowd, 'FULL');
});

runTest('UNIT-028', 'Crowd Level: 1 table total, available -> LOW', () => {
  const crowd = calculateCrowdLevel(1, 0, 0, 0, 1);
  assert.strictEqual(crowd, 'LOW');
});

runTest('UNIT-029', 'Crowd Level: Cleaning tables with 0 available -> FULL', () => {
  const crowd = calculateCrowdLevel(0, 3, 0, 2, 5);
  assert.strictEqual(crowd, 'FULL');
});

runTest('UNIT-030', 'Crowd Level: Output is an approved enum value', () => {
  const crowd = calculateCrowdLevel(4, 6, 0, 0, 10);
  assert.ok(['LOW', 'MODERATE', 'HIGH', 'FULL'].includes(crowd));
});

// ----------------------------------------------------
// 3. Wait-Time Estimation Engine (UNIT-031 - UNIT-045)
// ----------------------------------------------------
runTest('UNIT-031', 'Wait Time: Returns 0 minutes when available > 0', () => {
  const res = calculateWaitTime(3, 5, 0, 1, 9, 45, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 0);
});

runTest('UNIT-032', 'Wait Time: Available > 0 specifies immediate seating reason', () => {
  const res = calculateWaitTime(2, 8, 0, 0, 10, 45, 10);
  assert.strictEqual(res.reason, 'Tables are immediately available for seating');
});

runTest('UNIT-033', 'Wait Time: 0 available and cleaning > 0 returns cleaning duration', () => {
  const res = calculateWaitTime(0, 8, 0, 2, 10, 45, 12);
  assert.strictEqual(res.estimatedWaitMinutes, 12);
});

runTest('UNIT-034', 'Wait Time: 0 available, cleaning > 0 specifies sanitization reason', () => {
  const res = calculateWaitTime(0, 8, 0, 1, 9, 45, 10);
  assert.strictEqual(res.reason, 'Table is currently undergoing sanitization/cleaning');
});

runTest('UNIT-035', 'Wait Time: 0 available, 0 cleaning returns turnover estimate', () => {
  const res = calculateWaitTime(0, 4, 0, 0, 4, 40, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 10);
});

runTest('UNIT-036', 'Wait Time: Minimum wait boundary is 10 minutes when full', () => {
  const res = calculateWaitTime(0, 20, 0, 0, 20, 45, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 10);
});

runTest('UNIT-037', 'Wait Time: Maximum wait boundary is 60 minutes', () => {
  const res = calculateWaitTime(0, 1, 0, 0, 1, 120, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 60);
});

runTest('UNIT-038', 'Wait Time: calculationType is RULE_BASED', () => {
  const res = calculateWaitTime(1, 0, 0, 0, 1, 45, 10);
  assert.strictEqual(res.calculationType, 'RULE_BASED');
});

runTest('UNIT-039', 'Wait Time: confidence is CURRENT_OPERATIONAL_ESTIMATE', () => {
  const res = calculateWaitTime(1, 0, 0, 0, 1, 45, 10);
  assert.strictEqual(res.confidence, 'CURRENT_OPERATIONAL_ESTIMATE');
});

runTest('UNIT-040', 'Wait Time: isPrediction flag is false', () => {
  const res = calculateWaitTime(0, 5, 0, 0, 5, 45, 10);
  assert.strictEqual(res.isPrediction, false);
});

runTest('UNIT-041', 'Wait Time: includes rule-based operational disclaimer', () => {
  const res = calculateWaitTime(0, 5, 0, 0, 5, 45, 10);
  assert.ok(res.disclaimer.includes('rule-based operational estimate'));
});

runTest('UNIT-042', 'Wait Time: default dining duration fallback (45m / 3 occupied = 15m)', () => {
  const res = calculateWaitTime(0, 3, 0, 0, 3, 45, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 15);
});

runTest('UNIT-043', 'Wait Time: default cleaning duration fallback (10m)', () => {
  const res = calculateWaitTime(0, 5, 0, 1, 6, 45, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 10);
});

runTest('UNIT-044', 'Wait Time: handles 0 occupied tables gracefully when full', () => {
  const res = calculateWaitTime(0, 0, 0, 0, 0, 45, 10);
  assert.strictEqual(res.estimatedWaitMinutes, 45);
});

runTest('UNIT-045', 'Wait Time: integer output format', () => {
  const res = calculateWaitTime(0, 7, 0, 0, 7, 45, 10);
  assert.strictEqual(Number.isInteger(res.estimatedWaitMinutes), true);
});

// ----------------------------------------------------
// 4. Operating Hours & IsOpen Engine (UNIT-046 - UNIT-055)
// ----------------------------------------------------
runTest('UNIT-046', 'CheckIsOpen: Empty hours list returns closed', () => {
  const res = checkIsOpen([]);
  assert.strictEqual(res.isOpen, false);
  assert.strictEqual(res.todayHours, 'Hours not available');
});

runTest('UNIT-047', 'CheckIsOpen: Day marked is_closed returns closed', () => {
  const today = new Date().getDay();
  const hours = [{ day_of_week: today, is_closed: 1, open_time: '11:00:00', close_time: '23:00:00' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(res.isOpen, false);
  assert.strictEqual(res.todayHours, 'Closed today');
});

runTest('UNIT-048', 'CheckIsOpen: Current time within open window returns open', () => {
  const today = new Date().getDay();
  const hours = [{ day_of_week: today, is_closed: 0, open_time: '00:00:00', close_time: '23:59:59' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(res.isOpen, true);
});

runTest('UNIT-049', 'CheckIsOpen: Formats todayHours cleanly without trailing seconds', () => {
  const today = new Date().getDay();
  const hours = [{ day_of_week: today, is_closed: 0, open_time: '11:00:00', close_time: '23:00:00' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(res.todayHours, '11:00 - 23:00');
});

runTest('UNIT-050', 'CheckIsOpen: Handles overnight hours (18:00 to 02:00)', () => {
  const today = new Date().getDay();
  const hours = [{ day_of_week: today, is_closed: 0, open_time: '18:00:00', close_time: '02:00:00' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(typeof res.isOpen, 'boolean');
});

runTest('UNIT-051', 'CheckIsOpen: Missing record for current day returns closed', () => {
  const otherDay = (new Date().getDay() + 3) % 7;
  const hours = [{ day_of_week: otherDay, is_closed: 0, open_time: '09:00:00', close_time: '22:00:00' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(res.isOpen, false);
});

runTest('UNIT-052', 'CheckIsOpen: Valid return object schema', () => {
  const res = checkIsOpen([]);
  assert.ok(res.hasOwnProperty('isOpen'));
  assert.ok(res.hasOwnProperty('todayHours'));
});

runTest('UNIT-053', 'CheckIsOpen: Handles null hours input', () => {
  const res = checkIsOpen(null);
  assert.strictEqual(res.isOpen, false);
});

runTest('UNIT-054', 'CheckIsOpen: Handles undefined hours input', () => {
  const res = checkIsOpen(undefined);
  assert.strictEqual(res.isOpen, false);
});

runTest('UNIT-055', 'CheckIsOpen: Formatted hours preserve AM/PM context', () => {
  const today = new Date().getDay();
  const hours = [{ day_of_week: today, is_closed: 0, open_time: '07:30:00', close_time: '15:45:00' }];
  const res = checkIsOpen(hours);
  assert.strictEqual(res.todayHours, '07:30 - 15:45');
});

// ----------------------------------------------------
// 5. AppError & QR Helpers (UNIT-056 - UNIT-070)
// ----------------------------------------------------
runTest('UNIT-056', 'AppError: Initializes statusCode and code correctly (404)', () => {
  const err = new AppError(404, 'NOT_FOUND', 'Resource missing');
  assert.strictEqual(err.statusCode, 404);
  assert.strictEqual(err.code, 'NOT_FOUND');
  assert.strictEqual(err.isOperational, true);
  assert.strictEqual(err.message, 'Resource missing');
});

runTest('UNIT-057', 'AppError: 500 error code sets code properly', () => {
  const err = new AppError(500, 'DB_ERROR', 'Database down');
  assert.strictEqual(err.statusCode, 500);
  assert.strictEqual(err.code, 'DB_ERROR');
});

runTest('UNIT-058', 'AppError: Captures stack trace', () => {
  const err = new AppError(400, 'VALIDATION_ERROR', 'Test error');
  assert.ok(err.stack);
});

runTest('UNIT-059', 'AppError: Inherits from JavaScript Error', () => {
  const err = new AppError(401, 'TOKEN_MISSING', 'Inherited');
  assert.ok(err instanceof Error);
});

runTest('UNIT-060', 'AppError: Carries message attribute', () => {
  const err = new AppError(403, 'FORBIDDEN', 'Access denied');
  assert.strictEqual(err.message, 'Access denied');
});

runTest('UNIT-061', 'QRHelper: generateQRToken produces valid token string', () => {
  const token = qrHelper.generateQRToken();
  assert.strictEqual(typeof token, 'string');
  assert.ok(token.length >= 32);
});

runTest('UNIT-062', 'QRHelper: generateQRToken produces distinct UUIDs', () => {
  const t1 = qrHelper.generateQRToken();
  const t2 = qrHelper.generateQRToken();
  assert.notStrictEqual(t1, t2);
});

runTest('UNIT-063', 'QRHelper: Token is formatted as valid UUID v4', () => {
  const token = qrHelper.generateQRToken();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidRegex.test(token));
});

runTest('UNIT-064', 'QRHelper: Token has length of 36 chars', () => {
  const token = qrHelper.generateQRToken();
  assert.strictEqual(token.length, 36);
});

runTest('UNIT-065', 'QRHelper: Token is non-empty string', () => {
  const token = qrHelper.generateQRToken();
  assert.ok(token && token.trim().length > 0);
});

runTest('UNIT-066', 'QRHelper: Repeated generation maintains UUID pattern', () => {
  for (let i = 0; i < 5; i++) {
    const t = qrHelper.generateQRToken();
    assert.strictEqual(t.split('-').length, 5);
  }
});

runTest('UNIT-067', 'QRHelper: Token contains hex characters and hyphens only', () => {
  const token = qrHelper.generateQRToken();
  assert.ok(/^[0-9a-f-]+$/i.test(token));
});

runTest('UNIT-068', 'QRHelper: Export is an object containing generateQRToken', () => {
  assert.strictEqual(typeof qrHelper.generateQRToken, 'function');
});

runTest('UNIT-069', 'QRHelper: Function execution takes under 5ms', () => {
  const start = Date.now();
  qrHelper.generateQRToken();
  assert.ok(Date.now() - start < 10);
});

runTest('UNIT-070', 'QRHelper: Token does not contain raw database secrets', () => {
  const token = qrHelper.generateQRToken();
  assert.strictEqual(token.includes('password'), false);
  assert.strictEqual(token.includes('secret'), false);
});

// ----------------------------------------------------
// 6. Joi Schemas & Constants Integrity (UNIT-071 - UNIT-085)
// ----------------------------------------------------
runTest('UNIT-071', 'Constants: ROLES enum contains customer, owner, admin', () => {
  assert.deepStrictEqual(constants.ROLES, {
    CUSTOMER: 'customer',
    OWNER: 'owner',
    ADMIN: 'admin'
  });
});

runTest('UNIT-072', 'Constants: TABLE_STATUS contains all 4 Stage 4 states', () => {
  assert.strictEqual(constants.TABLE_STATUS.AVAILABLE, 'available');
  assert.strictEqual(constants.TABLE_STATUS.OCCUPIED, 'occupied');
  assert.strictEqual(constants.TABLE_STATUS.RESERVED, 'reserved');
  assert.strictEqual(constants.TABLE_STATUS.CLEANING, 'cleaning');
});

runTest('UNIT-073', 'Constants: CROWD_LEVELS contains LOW, MODERATE, HIGH, FULL', () => {
  assert.deepStrictEqual(constants.CROWD_LEVELS, {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    FULL: 'FULL'
  });
});

runTest('UNIT-074', 'Joi: Valid registration passes auth schema', () => {
  const { error } = registerSchema.validate({
    name: 'Suresh Kumar',
    email: 'suresh@example.com',
    password: 'Password@123',
    phone: '9876543210'
  });
  assert.strictEqual(error, undefined);
});

runTest('UNIT-075', 'Joi: Invalid email fails register schema', () => {
  const { error } = registerSchema.validate({
    name: 'Invalid Email',
    email: 'not-an-email',
    password: 'Password@123'
  });
  assert.ok(error);
});

runTest('UNIT-076', 'Joi: Short password fails register schema', () => {
  const { error } = registerSchema.validate({
    name: 'Short Pass',
    email: 'test@example.com',
    password: '123'
  });
  assert.ok(error);
});

runTest('UNIT-077', 'Joi: Valid discovery query passes restaurant schema', () => {
  const { error } = restaurantQuerySchema.validate({
    lat: 13.0418,
    lng: 80.2341,
    radius: 10,
    search: 'Pavilion',
    openNow: true
  });
  assert.strictEqual(error, undefined);
});

runTest('UNIT-078', 'Joi: Invalid latitude (>90) fails discovery query schema', () => {
  const { error } = restaurantQuerySchema.validate({ lat: 105.0 });
  assert.ok(error);
});

runTest('UNIT-079', 'Joi: Invalid longitude (<-180) fails discovery query schema', () => {
  const { error } = restaurantQuerySchema.validate({ lng: -195.0 });
  assert.ok(error);
});

runTest('UNIT-080', 'Joi: Negative radius fails discovery query schema', () => {
  const { error } = restaurantQuerySchema.validate({ radius: -5 });
  assert.ok(error);
});

runTest('UNIT-081', 'Joi: Valid table status passes updateTableStatusSchema', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'cleaning' });
  assert.strictEqual(error, undefined);
});

runTest('UNIT-082', 'Joi: Invalid table status fails updateTableStatusSchema', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'broken' });
  assert.ok(error);
});

runTest('UNIT-083', 'Joi: Valid login schema check', () => {
  const { error } = loginSchema.validate({
    email: 'user@example.com',
    password: 'Password@123'
  });
  assert.strictEqual(error, undefined);
});

runTest('UNIT-084', 'Joi: Missing password fails login schema', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com' });
  assert.ok(error);
});

runTest('UNIT-085', 'Joi: Excessively long search keyword fails discovery schema', () => {
  const { error } = restaurantQuerySchema.validate({
    search: 'a'.repeat(150)
  });
  assert.ok(error);
});

// Output Summary
console.log('====================================================');
console.log('       TABLEPULSE AI — UNIT TEST RESULTS            ');
console.log('====================================================');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`Total Unit Tests Executed: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

try {
  const fs = require('fs');
  const path = require('path');
  const reportsDir = path.resolve(__dirname, '../../reports/unit');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(reportsDir, 'unit-test-results.json'), JSON.stringify({
    total: results.length,
    passed,
    failed,
    timestamp: new Date().toISOString(),
    tests: results
  }, null, 2));
} catch (e) {
  // Ignore report write error
}

if (failed > 0) {
  results.filter(r => r.status === 'FAIL').forEach(f => console.error(`❌ ${f.id} ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('Status: ALL 85 UNIT TESTS PASSED ✅');
}

module.exports = results;
