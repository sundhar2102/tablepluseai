import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 300,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'], // error rate < 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests under 1.5s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api';

export default function () {
  // 1. Restaurant Discovery List
  const resDiscovery = http.get(`${BASE_URL}/restaurants`);
  check(resDiscovery, {
    'restaurants status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Restaurant Detail
  const resDetail = http.get(`${BASE_URL}/restaurants/1`);
  check(resDetail, {
    'restaurant detail is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 3. Menu Endpoint
  const resMenu = http.get(`${BASE_URL}/restaurants/1/menu`);
  check(resMenu, {
    'menu status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
