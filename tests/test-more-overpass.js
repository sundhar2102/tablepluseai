const testList = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

const query = `[out:json][timeout:10];
(
  node["amenity"="restaurant"](around:2000,13.0418,80.2341);
);
out body 10;`;

async function testMore() {
  for (const ep of testList) {
    const start = Date.now();
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'TablePulse-AI/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json();
      console.log(`Endpoint: ${ep} | Status: ${res.status} | Elements: ${data.elements?.length} | Time: ${Date.now() - start}ms`);
    } catch (e) {
      console.log(`Endpoint: ${ep} | FAILED: ${e.message} | Time: ${Date.now() - start}ms`);
    }
  }
}

testMore();
