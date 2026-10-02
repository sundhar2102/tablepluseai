/**
 * TablePulse AI - Master Controlled Test Data Catalog
 */

module.exports = {
  users: {
    customer: {
      email: 'customer@demo.com',
      password: 'Demo@1234',
      name: 'Customer User',
      role: 'customer'
    },
    owner: {
      email: 'owner@demo.com',
      password: 'Demo@1234',
      name: 'Rahul Sharma',
      role: 'owner',
      restaurantId: 1
    },
    admin: {
      email: 'admin@tablepulse.app',
      password: 'Demo@1234',
      name: 'Super Admin',
      role: 'admin'
    },
    invalid: {
      email: 'nonexistent_user@tablepulse.fake',
      password: 'WrongPassword!999',
      role: 'unknown'
    }
  },

  restaurants: {
    valid: {
      id: 1,
      name: 'The Spice Pavilion',
      slug: 'the-spice-pavilion',
      cuisine: 'South Indian & Chettinad',
      lat: 13.0418,
      lng: 80.2341,
      totalTables: 12
    },
    coastal: {
      id: 2,
      name: 'Coastal Catch & Grills',
      area: 'Nungambakkam',
      cuisine: 'Seafood & Coastal',
      lat: 13.0587,
      lng: 80.2435
    },
    inactive: {
      id: 6,
      name: 'Bayview Bistro',
      status: 'pending'
    },
    invalidId: 999999
  },

  coordinates: {
    tNagar: { lat: 13.0418, lng: 80.2341, name: 'T. Nagar' },
    nungambakkam: { lat: 13.0587, lng: 80.2435, name: 'Nungambakkam' },
    annaNagar: { lat: 13.0850, lng: 80.2101, name: 'Anna Nagar' },
    alwarpet: { lat: 13.0336, lng: 80.2505, name: 'Alwarpet' },
    adyar: { lat: 13.0012, lng: 80.2565, name: 'Adyar' },
    invalidLat: { lat: 195.0, lng: 80.0 },
    invalidLng: { lat: 13.0, lng: -210.0 },
    nonNumeric: { lat: 'invalid_lat', lng: 'invalid_lng' }
  },

  tables: {
    validTableId: 1,
    invalidTableId: 88888,
    statuses: ['available', 'occupied', 'reserved', 'cleaning'],
    invalidStatus: 'broken_state'
  },

  security: {
    sqliPayloads: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1 UNION SELECT 1,2,3--",
      "admin' --"
    ],
    xssPayloads: [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert(1)>",
      "javascript:alert(1)"
    ],
    malformedJwts: [
      "invalid.bearer.token",
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalidSignature",
      "Bearer "
    ]
  }
};
