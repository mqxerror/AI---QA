import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 min
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 min
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must complete below 500ms
    'http_req_duration{staticAsset:yes}': ['p(95)<200'], // Static assets faster
    errors: ['rate<0.01'],              // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://variablelib.com';

export default function () {
  // Test 1: Homepage
  let res = http.get(BASE_URL);

  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
    'homepage has content': (r) => r.body.length > 1000,
  });

  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);

  sleep(1);

  // Test 2: Common pages
  const pages = [
    '/about',
    '/contact',
    '/services',
    '/pricing',
    '/blog'
  ];

  const randomPage = pages[Math.floor(Math.random() * pages.length)];
  res = http.get(`${BASE_URL}${randomPage}`);

  check(res, {
    [`${randomPage} status is 2xx or 3xx`]: (r) => r.status < 400,
    [`${randomPage} loads in <3s`]: (r) => r.timings.duration < 3000,
  });

  errorRate.add(res.status >= 400);
  responseTime.add(res.timings.duration);

  sleep(0.5);

  // Test 3: Static assets (simulate browser loading CSS/JS)
  const staticAssets = [
    '/style.css',
    '/main.js',
    '/logo.png'
  ];

  for (const asset of staticAssets) {
    res = http.get(`${BASE_URL}${asset}`, {
      tags: { staticAsset: 'yes' }
    });

    check(res, {
      [`${asset} available`]: (r) => r.status < 404,
    });

    if (res.status >= 400 && res.status !== 404) {
      errorRate.add(true);
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  const summary = {
    start_time: data.state.testRunDurationMs,
    metrics: {},
    thresholds: {}
  };

  // Extract key metrics
  if (data.metrics.http_reqs) {
    summary.metrics.total_requests = data.metrics.http_reqs.values.count;
    summary.metrics.requests_per_second = data.metrics.http_reqs.values.rate;
  }

  if (data.metrics.http_req_duration) {
    summary.metrics.avg_duration_ms = data.metrics.http_req_duration.values.avg;
    summary.metrics.p50_ms = data.metrics.http_req_duration.values['p(50)'];
    summary.metrics.p90_ms = data.metrics.http_req_duration.values['p(90)'];
    summary.metrics.p95_ms = data.metrics.http_req_duration.values['p(95)'];
    summary.metrics.p99_ms = data.metrics.http_req_duration.values['p(99)'];
    summary.metrics.max_ms = data.metrics.http_req_duration.values.max;
  }

  if (data.metrics.http_req_failed) {
    summary.metrics.failed_requests = data.metrics.http_req_failed.values.passes || 0;
    summary.metrics.error_rate = data.metrics.http_req_failed.values.rate || 0;
  }

  if (data.metrics.data_received) {
    summary.metrics.data_received_bytes = data.metrics.data_received.values.count;
  }

  if (data.metrics.data_sent) {
    summary.metrics.data_sent_bytes = data.metrics.data_sent.values.count;
  }

  // Check thresholds
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.thresholds) {
    summary.thresholds = data.metrics.http_req_duration.thresholds;
  }

  console.log('=== Load Test Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
