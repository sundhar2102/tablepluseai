const overpassService = require('../server/src/services/overpass.service');

async function testMumbai() {
  const start = Date.now();
  try {
    console.log('Testing Mumbai (lat: 19.0596, lng: 72.8295, radius: 5km)...');
    const results = await overpassService.fetchRestaurantsFromOverpass(19.0596, 72.8295, 5);
    console.log(`[PASS] Mumbai: Found ${results.length} real restaurants in ${Date.now() - start}ms.`);
    if (results.length > 0) {
      console.log(`   Sample: "${results[0]?.name}" at ${results[0]?.distanceKm} km (lat: ${results[0]?.latitude}, lon: ${results[0]?.longitude})`);
    }
  } catch (err) {
    console.error(`[FAIL] Mumbai: ${err.message} in ${Date.now() - start}ms`);
  }
}

testMumbai();
