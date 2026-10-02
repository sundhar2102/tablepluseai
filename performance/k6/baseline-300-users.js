/**
 * TablePulse AI - k6 Baseline Load Testing Script
 * Concurrency: 300 Virtual Users (VUs)
 * Duration: 1 Minute (60s)
 * Target: Normal expected baseline load on Express Backend (http://localhost:3001)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 300 }, // Ramp-up to 300 VUs
    { duration: '40s', target: 300 }, // Sustained load at 300 VUs
    { duration: '10s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // HTTP error rate must be < 1%
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete below 500ms, 99% below 1s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // 1. Health check endpoint
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
    'health response is ok': (r) => JSON.parse(r.body).status === 'ok',
  });

  // 2. Restaurant Discovery / List endpoint
  const resList = http.get(`${BASE_URL}/api/restaurants?lat=13.0827&lng=80.2707&radius=10`);
  check(resList, {
    'restaurant list status is 200': (r) => r.status === 200,
  });

  // 3. Restaurant Details endpoint
  const resDetails = http.get(`${BASE_URL}/api/restaurants/1`);
  check(resDetails, {
    'restaurant details status is 200': (r) => r.status === 200,
  });

  // 4. Live Table Availability endpoint
  const resTables = http.get(`${BASE_URL}/api/restaurants/1/tables`);
  check(resTables, {
    'table availability status is 200': (r) => r.status === 200,
  });

  // Sleep 0.5s between iterations per VU
  sleep(0.5);
}
