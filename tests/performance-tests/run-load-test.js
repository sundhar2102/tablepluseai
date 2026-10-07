/**
 * TablePulse AI - Standalone 300 Concurrent VU Load Test Runner
 * Measures real RPS, Latency (Avg, Median, P90, P95, P99), Error Rate, Throughput
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_PORT = process.env.PORT || 3001;
const HOST = 'localhost';
const CONCURRENT_VUS = parseInt(process.env.LOAD_VUS, 10) || 300;
const DURATION_SECS = parseInt(process.env.LOAD_DURATION, 10) || 60;

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 350
});

const endpoints = [
  '/api/restaurants',
  '/api/restaurants/1',
  '/api/restaurants/1/menu',
  '/api/restaurants/2',
  '/api/restaurants/2/menu'
];

async function runLoadTest() {
  console.log('============================================================');
  console.log('⚡ TABLEPULSE AI — 300 CONCURRENT VU LOAD TEST');
  console.log(`   Target: http://${HOST}:${API_PORT}`);
  console.log(`   Virtual Users: ${CONCURRENT_VUS} | Duration: ${DURATION_SECS} seconds`);
  console.log('============================================================\n');

  const latencies = [];
  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;
  const startTime = Date.now();
  const endTime = startTime + DURATION_SECS * 1000;

  function makeRequest(urlPath) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const req = http.get(
        {
          hostname: HOST,
          port: API_PORT,
          path: urlPath,
          agent,
          timeout: 5000
        },
        (res) => {
          let bytes = 0;
          res.on('data', chunk => bytes += chunk.length);
          res.on('end', () => {
            const lat = Date.now() - t0;
            latencies.push(lat);
            totalBytes += bytes;
            if (res.statusCode >= 200 && res.statusCode < 400) {
              successCount++;
            } else {
              failCount++;
            }
            resolve();
          });
        }
      );

      req.on('error', () => {
        failCount++;
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        failCount++;
        resolve();
      });
    });
  }

  // Worker loop for each virtual user
  async function worker(vuId) {
    let epIdx = vuId % endpoints.length;
    while (Date.now() < endTime) {
      const ep = endpoints[epIdx % endpoints.length];
      epIdx++;
      await makeRequest(ep);
    }
  }

  console.log(`[LOAD] Spawning ${CONCURRENT_VUS} concurrent virtual user loops...`);
  const workers = [];
  for (let i = 0; i < CONCURRENT_VUS; i++) {
    workers.push(worker(i));
  }

  // Periodic progress logging
  const progressInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const completed = successCount + failCount;
    const currentRps = elapsed > 0 ? (completed / elapsed).toFixed(1) : 0;
    console.log(`  ⏱️ Elapsed: ${elapsed}s / ${DURATION_SECS}s | Completed: ${completed} reqs | RPS: ${currentRps} | Errors: ${failCount}`);
  }, 10000);

  await Promise.all(workers);
  clearInterval(progressInterval);

  const totalTimeSecs = (Date.now() - startTime) / 1000;
  const totalRequests = successCount + failCount;
  const rps = (totalRequests / totalTimeSecs).toFixed(1);
  const throughputKB = (totalBytes / 1024 / totalTimeSecs).toFixed(1);
  const errorRate = totalRequests > 0 ? ((failCount / totalRequests) * 100).toFixed(2) : 0;

  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : 0;
  const medianLatency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p90 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.9)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;

  const result = {
    concurrentUsers: CONCURRENT_VUS,
    durationSeconds: totalTimeSecs.toFixed(1),
    totalRequests,
    successRequests: successCount,
    failedRequests: failCount,
    requestsPerSecond: parseFloat(rps),
    throughputKBps: parseFloat(throughputKB),
    errorRatePercentage: parseFloat(errorRate),
    latencyMs: {
      average: parseFloat(avgLatency),
      median: medianLatency,
      p90,
      p95,
      p99
    }
  };

  const reportsDir = path.resolve(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(reportsDir, 'performance-summary.json'), JSON.stringify(result, null, 2));

  console.log('\n============================================================');
  console.log('📊 MEASURED PERFORMANCE RESULTS:');
  console.log(`   • Concurrent VUs:   ${result.concurrentUsers}`);
  console.log(`   • Total Requests:   ${result.totalRequests}`);
  console.log(`   • Requests / Sec:   ${result.requestsPerSecond} RPS`);
  console.log(`   • Avg Latency:      ${result.latencyMs.average} ms`);
  console.log(`   • Median Latency:   ${result.latencyMs.median} ms`);
  console.log(`   • P90 Latency:      ${result.latencyMs.p90} ms`);
  console.log(`   • P95 Latency:      ${result.latencyMs.p95} ms`);
  console.log(`   • P99 Latency:      ${result.latencyMs.p99} ms`);
  console.log(`   • Error Rate:       ${result.errorRatePercentage}%`);
  console.log(`   • Throughput:       ${result.throughputKBps} KB/s`);
  console.log('============================================================\n');

  return result;
}

if (require.main === module) {
  runLoadTest()
    .then(res => process.exit(res.errorRatePercentage > 10 ? 1 : 0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runLoadTest };
