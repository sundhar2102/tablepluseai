/**
 * Smart Table AI - Validation Test Suite (85 Validation Tests)
 * IDs: VAL-001 to VAL-085
 */

const assert = require('assert');
const { registerSchema, loginSchema } = require('../../server/src/validations/auth.validation');
const { restaurantQuerySchema, updateTableStatusSchema } = require('../../server/src/validations/restaurant.validation');

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
// 1. Auth Registration Validation (VAL-001 - VAL-025)
// ----------------------------------------------------
runTest('VAL-001', 'Register: Valid registration payload passes', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-002', 'Register: Missing name triggers required error', () => {
  const { error } = registerSchema.validate({ email: 'rahul@example.com', password: 'Password@123' });
  assert.ok(error && error.details[0].path.includes('name'));
});

runTest('VAL-003', 'Register: Empty name string fails', () => {
  const { error } = registerSchema.validate({ name: '', email: 'rahul@example.com', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-004', 'Register: Name below min length (1 char) fails', () => {
  const { error } = registerSchema.validate({ name: 'A', email: 'rahul@example.com', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-005', 'Register: Name exceeding max length (100 chars) fails', () => {
  const { error } = registerSchema.validate({ name: 'A'.repeat(101), email: 'rahul@example.com', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-006', 'Register: Missing email triggers required error', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', password: 'Password@123' });
  assert.ok(error && error.details[0].path.includes('email'));
});

runTest('VAL-007', 'Register: Email missing @ fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul.com', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-008', 'Register: Email missing domain fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-009', 'Register: Email with spaces fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rah ul@example.com', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-010', 'Register: Missing password triggers required error', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com' });
  assert.ok(error && error.details[0].path.includes('password'));
});

runTest('VAL-011', 'Register: Password under 8 chars fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Short1' });
  assert.ok(error);
});

runTest('VAL-012', 'Register: Password exactly 8 chars passes', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Passw123' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-013', 'Register: Password with 70 chars passes', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'A1' + 'a'.repeat(68) });
  assert.strictEqual(error, undefined);
});

runTest('VAL-014', 'Register: Password exceeding 72 chars fails (bcrypt safe limit)', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'A1' + 'a'.repeat(71) });
  assert.ok(error);
});

runTest('VAL-015', 'Register: Phone is optional', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-016', 'Register: Valid 10-digit phone passes', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123', phone: '9876543210' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-017', 'Register: Invalid phone with letters fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123', phone: '98765abcde' });
  assert.ok(error);
});

runTest('VAL-018', 'Register: Short phone (<7 digits) fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123', phone: '12345' });
  assert.ok(error);
});

runTest('VAL-019', 'Register: Long phone (>20 digits) fails', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123', phone: '123456789012345678901' });
  assert.ok(error);
});

runTest('VAL-020', 'Register: Trims whitespace from name', () => {
  const { value } = registerSchema.validate({ name: '  Rahul Sharma  ', email: 'rahul@example.com', password: 'Password@123' });
  assert.strictEqual(value.name, 'Rahul Sharma');
});

runTest('VAL-021', 'Register: Converts email to lowercase', () => {
  const { value } = registerSchema.validate({ name: 'Rahul', email: 'RAHUL@EXAMPLE.COM', password: 'Password@123' });
  assert.strictEqual(value.email, 'rahul@example.com');
});

runTest('VAL-022', 'Register: Rejects unknown fields', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: 'Password@123', isAdmin: true });
  assert.ok(error);
});

runTest('VAL-023', 'Register: Rejects null email', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: null, password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-024', 'Register: Rejects null password', () => {
  const { error } = registerSchema.validate({ name: 'Rahul', email: 'rahul@example.com', password: null });
  assert.ok(error);
});

runTest('VAL-025', 'Register: Rejects empty object', () => {
  const { error } = registerSchema.validate({});
  assert.ok(error);
});

// ----------------------------------------------------
// 2. Auth Login Validation (VAL-026 - VAL-040)
// ----------------------------------------------------
runTest('VAL-026', 'Login: Valid email and password passes', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com', password: 'Password@123' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-027', 'Login: Missing email fails', () => {
  const { error } = loginSchema.validate({ password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-028', 'Login: Empty email fails', () => {
  const { error } = loginSchema.validate({ email: '', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-029', 'Login: Invalid email format fails', () => {
  const { error } = loginSchema.validate({ email: 'bad-email', password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-030', 'Login: Missing password fails', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com' });
  assert.ok(error);
});

runTest('VAL-031', 'Login: Empty password fails', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com', password: '' });
  assert.ok(error);
});

runTest('VAL-032', 'Login: Trims email whitespace', () => {
  const { value } = loginSchema.validate({ email: '  user@example.com  ', password: 'Password@123' });
  assert.strictEqual(value.email, 'user@example.com');
});

runTest('VAL-033', 'Login: Converts email to lowercase', () => {
  const { value } = loginSchema.validate({ email: 'USER@EXAMPLE.COM', password: 'Password@123' });
  assert.strictEqual(value.email, 'user@example.com');
});

runTest('VAL-034', 'Login: Disallows unknown properties', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com', password: 'Password@123', extra: 'bad' });
  assert.ok(error);
});

runTest('VAL-035', 'Login: SQL injection in email string caught by email validator', () => {
  const { error } = loginSchema.validate({ email: "' OR '1'='1", password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-036', 'Login: Non-string email fails', () => {
  const { error } = loginSchema.validate({ email: 12345, password: 'Password@123' });
  assert.ok(error);
});

runTest('VAL-037', 'Login: Non-string password fails', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com', password: 12345678 });
  assert.ok(error);
});

runTest('VAL-038', 'Login: Password with special chars is allowed', () => {
  const { error } = loginSchema.validate({ email: 'user@example.com', password: 'P@ssw0rd!#$%' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-039', 'Login: Empty object fails', () => {
  const { error } = loginSchema.validate({});
  assert.ok(error);
});

runTest('VAL-040', 'Login: Null object fails', () => {
  const { error } = loginSchema.validate(null);
  assert.ok(error);
});

// ----------------------------------------------------
// 3. Restaurant Discovery Query Validation (VAL-041 - VAL-065)
// ----------------------------------------------------
runTest('VAL-041', 'Discovery: Empty query object passes (defaults applied)', () => {
  const { error, value } = restaurantQuerySchema.validate({});
  assert.strictEqual(error, undefined);
  assert.strictEqual(value.radius, 5);
});

runTest('VAL-042', 'Discovery: Valid lat/lng pair passes', () => {
  const { error } = restaurantQuerySchema.validate({ lat: 13.0418, lng: 80.2341 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-043', 'Discovery: Valid latitude aliases (latitude, longitude) pass', () => {
  const { error } = restaurantQuerySchema.validate({ latitude: 13.0418, longitude: 80.2341 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-044', 'Discovery: Latitude exactly -90 passes', () => {
  const { error } = restaurantQuerySchema.validate({ lat: -90 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-045', 'Discovery: Latitude exactly 90 passes', () => {
  const { error } = restaurantQuerySchema.validate({ lat: 90 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-046', 'Discovery: Latitude < -90 fails', () => {
  const { error } = restaurantQuerySchema.validate({ lat: -90.001 });
  assert.ok(error);
});

runTest('VAL-047', 'Discovery: Latitude > 90 fails', () => {
  const { error } = restaurantQuerySchema.validate({ lat: 90.001 });
  assert.ok(error);
});

runTest('VAL-048', 'Discovery: Longitude exactly -180 passes', () => {
  const { error } = restaurantQuerySchema.validate({ lng: -180 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-049', 'Discovery: Longitude exactly 180 passes', () => {
  const { error } = restaurantQuerySchema.validate({ lng: 180 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-050', 'Discovery: Longitude < -180 fails', () => {
  const { error } = restaurantQuerySchema.validate({ lng: -180.001 });
  assert.ok(error);
});

runTest('VAL-051', 'Discovery: Longitude > 180 fails', () => {
  const { error } = restaurantQuerySchema.validate({ lng: 180.001 });
  assert.ok(error);
});

runTest('VAL-052', 'Discovery: String numbers for lat/lng are cast to numbers', () => {
  const { value } = restaurantQuerySchema.validate({ lat: '13.05', lng: '80.24' });
  assert.strictEqual(typeof value.lat, 'number');
  assert.strictEqual(typeof value.lng, 'number');
});

runTest('VAL-053', 'Discovery: Non-numeric lat string fails', () => {
  const { error } = restaurantQuerySchema.validate({ lat: 'not_a_coord' });
  assert.ok(error);
});

runTest('VAL-054', 'Discovery: Non-numeric lng string fails', () => {
  const { error } = restaurantQuerySchema.validate({ lng: 'not_a_coord' });
  assert.ok(error);
});

runTest('VAL-055', 'Discovery: Radius 1 km passes', () => {
  const { error } = restaurantQuerySchema.validate({ radius: 1 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-056', 'Discovery: Radius 100 km passes', () => {
  const { error } = restaurantQuerySchema.validate({ radius: 100 });
  assert.strictEqual(error, undefined);
});

runTest('VAL-057', 'Discovery: Radius 0 fails (must be positive)', () => {
  const { error } = restaurantQuerySchema.validate({ radius: 0 });
  assert.ok(error);
});

runTest('VAL-058', 'Discovery: Radius > 100 km fails', () => {
  const { error } = restaurantQuerySchema.validate({ radius: 100.1 });
  assert.ok(error);
});

runTest('VAL-059', 'Discovery: Search keyword trimmed', () => {
  const { value } = restaurantQuerySchema.validate({ search: '  Spice  ' });
  assert.strictEqual(value.search, 'Spice');
});

runTest('VAL-060', 'Discovery: Empty search string allowed', () => {
  const { error } = restaurantQuerySchema.validate({ search: '' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-061', 'Discovery: Search keyword max 100 chars allowed', () => {
  const { error } = restaurantQuerySchema.validate({ search: 'a'.repeat(100) });
  assert.strictEqual(error, undefined);
});

runTest('VAL-062', 'Discovery: Search keyword > 100 chars rejected', () => {
  const { error } = restaurantQuerySchema.validate({ search: 'a'.repeat(101) });
  assert.ok(error);
});

runTest('VAL-063', 'Discovery: Area filter trimmed and allowed', () => {
  const { value } = restaurantQuerySchema.validate({ area: '  T. Nagar  ' });
  assert.strictEqual(value.area, 'T. Nagar');
});

runTest('VAL-064', 'Discovery: openNow truthy value parsed to boolean true', () => {
  const { value } = restaurantQuerySchema.validate({ openNow: 'true' });
  assert.strictEqual(value.openNow, true);
});

runTest('VAL-065', 'Discovery: openNow falsy value parsed to boolean false', () => {
  const { value } = restaurantQuerySchema.validate({ openNow: '0' });
  assert.strictEqual(value.openNow, false);
});

// ----------------------------------------------------
// 4. Table Status Mutation Validation (VAL-066 - VAL-085)
// ----------------------------------------------------
runTest('VAL-066', 'Table Status: status "available" passes', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'available' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-067', 'Table Status: status "occupied" passes', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'occupied' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-068', 'Table Status: status "reserved" passes', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'reserved' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-069', 'Table Status: status "cleaning" passes', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'cleaning' });
  assert.strictEqual(error, undefined);
});

runTest('VAL-070', 'Table Status: status "broken" fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'broken' });
  assert.ok(error);
});

runTest('VAL-071', 'Table Status: status "pending" fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'pending' });
  assert.ok(error);
});

runTest('VAL-072', 'Table Status: status "deleted" fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'deleted' });
  assert.ok(error);
});

runTest('VAL-073', 'Table Status: Uppercase "AVAILABLE" fails (strict enum check)', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'AVAILABLE' });
  assert.ok(error);
});

runTest('VAL-074', 'Table Status: Empty status string fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: '' });
  assert.ok(error);
});

runTest('VAL-075', 'Table Status: Missing status field fails', () => {
  const { error } = updateTableStatusSchema.validate({});
  assert.ok(error);
});

runTest('VAL-076', 'Table Status: Null status field fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: null });
  assert.ok(error);
});

runTest('VAL-077', 'Table Status: Numeric status fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: 1 });
  assert.ok(error);
});

runTest('VAL-078', 'Table Status: Boolean status fails', () => {
  const { error } = updateTableStatusSchema.validate({ status: true });
  assert.ok(error);
});

runTest('VAL-079', 'Table Status: Rejects extra keys', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'available', force: true });
  assert.ok(error);
});

runTest('VAL-080', 'Table Status: Rejects SQL injection in status field', () => {
  const { error } = updateTableStatusSchema.validate({ status: "available'; DROP TABLE tables;--" });
  assert.ok(error);
});

runTest('VAL-081', 'Table Status: Rejects whitespace padding in enum', () => {
  const { error } = updateTableStatusSchema.validate({ status: '  available  ' });
  assert.ok(error);
});

runTest('VAL-082', 'Table Status: Custom error message present on invalid enum', () => {
  const { error } = updateTableStatusSchema.validate({ status: 'unknown_state' });
  assert.ok(error.details[0].message.includes('Status must be available, occupied, reserved, or cleaning'));
});

runTest('VAL-083', 'Table Status: Valid schema output object has status', () => {
  const { value } = updateTableStatusSchema.validate({ status: 'occupied' });
  assert.strictEqual(value.status, 'occupied');
});

runTest('VAL-084', 'Table Status: Array payload fails object schema', () => {
  const { error } = updateTableStatusSchema.validate(['available']);
  assert.ok(error);
});

runTest('VAL-085', 'Table Status: Primitive string input fails object schema', () => {
  const { error } = updateTableStatusSchema.validate('available');
  assert.ok(error);
});

// Output Summary
console.log('====================================================');
console.log('     SMART TABLE AI — VALIDATION TEST RESULTS       ');
console.log('====================================================');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`Total Validation Tests Executed: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  results.filter(r => r.status === 'FAIL').forEach(f => console.error(`❌ ${f.id} ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('Status: ALL 85 VALIDATION TESTS PASSED ✅');
}

module.exports = results;
