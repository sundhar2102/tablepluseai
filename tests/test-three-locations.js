const overpassService = require('../server/src/services/overpass.service');

async function testLocations() {
  const locations = [
    { city: 'Chennai', lat: 13.0418, lng: 80.2341, radius: 5 },
    { city: 'Bengaluru', lat: 12.9784, lng: 77.6408, radius: 5 },
    { city: 'Mumbai', lat: 19.0596, lng: 72.8295, radius: 5 }
  ];

  for (const loc of locations) {
    const start = Date.now();
    try {
      const results = await overpassService.fetchRestaurantsFromOverpass(loc.lat, loc.lng, loc.radius);
      console.log(`[PASS] ${loc.city}: Found ${results.length} real restaurants in ${Date.now() - start}ms.`);
      console.log(`   Sample: "${results[0]?.name}" at ${results[0]?.distanceKm} km (lat: ${results[0]?.latitude}, lon: ${results[0]?.longitude})`);
    } catch (err) {
      console.error(`[FAIL] ${loc.city}: ${err.message}`);
    }
  }
}

testLocations();
