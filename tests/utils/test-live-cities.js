/**
 * TablePulse AI - Live Multi-City GPS & Overpass Restaurant Discovery Verification
 * Tests live coordinates for:
 * 1. Chennai:   13.0827, 80.2707
 * 2. Bengaluru: 12.9716, 77.5946
 * 3. Hyderabad: 17.3850, 78.4867
 * 4. Mumbai:    19.0760, 72.8777
 * 5. Delhi:     28.6139, 77.2090
 */

const fs = require('fs');
const path = require('path');

const CITIES = [
  { name: 'Chennai',   lat: 13.0827, lng: 80.2707, radius: 10 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, radius: 10 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, radius: 10 },
  { name: 'Mumbai',    lat: 19.0760, lng: 72.8777, radius: 10 },
  { name: 'Delhi',     lat: 28.6139, lng: 77.2090, radius: 10 }
];

const BASE_URL = 'http://localhost:3001/api';

async function testCity(city) {
  console.log(`\nTesting ${city.name} (${city.lat}, ${city.lng}, radius: ${city.radius}km)...`);
  const start = Date.now();
  try {
    const url = `${BASE_URL}/restaurants?lat=${city.lat}&lng=${city.lng}&radius=${city.radius}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const duration = Date.now() - start;
    const json = await res.json().catch(() => null);

    const restaurants = json?.data?.restaurants || [];
    const sourceBreakdown = {
      tablepulse: restaurants.filter(r => r.source === 'tablepulse' || !r.source).length,
      osm: restaurants.filter(r => r.source === 'osm').length
    };

    const sampleNames = restaurants.slice(0, 5).map(r => ({
      name: r.name,
      cuisine: r.cuisine || r.cuisineType || 'Various',
      distanceKm: r.distanceKm,
      source: r.source || 'tablepulse',
      isPartner: r.isPartner
    }));

    const result = {
      city: city.name,
      coordinates: `${city.lat}, ${city.lng}`,
      radiusKm: city.radius,
      httpStatus: res.status,
      durationMs: duration,
      restaurantCount: restaurants.length,
      sourceBreakdown,
      sampleRestaurants: sampleNames,
      error: res.status === 200 ? null : (json?.error?.message || 'HTTP error')
    };

    console.log(`✅ ${city.name}: HTTP ${res.status} | Found ${restaurants.length} restaurants (${sourceBreakdown.tablepulse} TablePulse, ${sourceBreakdown.osm} OSM) in ${duration}ms`);
    if (sampleNames.length > 0) {
      console.log(`   Sample: ${sampleNames.map(s => `"${s.name}" (${s.distanceKm ? s.distanceKm + 'km' : 'N/A'}, src: ${s.source})`).join(', ')}`);
    }
    return result;
  } catch (err) {
    console.error(`❌ ${city.name} Failed: ${err.message}`);
    return {
      city: city.name,
      coordinates: `${city.lat}, ${city.lng}`,
      radiusKm: city.radius,
      httpStatus: 0,
      durationMs: Date.now() - start,
      restaurantCount: 0,
      sourceBreakdown: { tablepulse: 0, osm: 0 },
      sampleRestaurants: [],
      error: err.message
    };
  }
}

(async () => {
  console.log('================================================================');
  console.log('TABLEPULSE AI — MULTI-CITY GPS & OVERPASS DISCOVERY TEST');
  console.log('================================================================');

  const report = [];
  for (const city of CITIES) {
    const res = await testCity(city);
    report.push(res);
  }

  const outPath = path.join(__dirname, '..', '..', 'docs', 'live-city-gps-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nSaved multi-city report to ${outPath}`);

  const allPassed = report.every(r => r.httpStatus === 200 && r.restaurantCount > 0);
  console.log(`\nOverall Multi-City Result: ${allPassed ? 'ALL PASSED ✅' : 'PARTIAL/FAILED ❌'}`);
  process.exit(allPassed ? 0 : 1);
})();
