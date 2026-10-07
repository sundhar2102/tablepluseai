const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const query = `[out:json][timeout:10];
(
  node["amenity"="restaurant"](around:2000,13.0418,80.2341);
);
out body 10;`;

async function testEndpoints() {
  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'TablePulse-AI/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      console.log(`Endpoint: ${ep} | Status: ${res.status} | Elements: ${data.elements?.length} | Time: ${Date.now() - start}ms`);
    } catch (e) {
      console.log(`Endpoint: ${ep} | FAILED: ${e.message} | Time: ${Date.now() - start}ms`);
    }
  }
}

testEndpoints();
