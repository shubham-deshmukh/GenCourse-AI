import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Testing Options
export const options = {
  scenarios: {
    sse_load_test: {
      executor: 'constant-vus',
      vus: 100, // 100 concurrent users
      duration: '15s', // Run for 15 seconds
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // Fail rate must be under 1%
  },
};

// setup() runs once before VUs start. We initialize a valid course in the DB.
export function setup() {
  const url = 'http://localhost:5000/api/courses';
  const payload = JSON.stringify({ title: 'k6 Performance Testing' });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-User': 'true',
    },
  };

  const res = http.post(url, payload, params);
  const data = JSON.parse(res.body);
  console.log(`[k6-SETUP] Successfully initialized course shell in DB. ID: ${data.courseId}`);
  return { courseId: data.courseId };
}

// Each VU executes this function concurrently, using the setup data
export default function (data) {
  const url = `http://localhost:5000/api/courses/${data.courseId}/stream?mockUser=true`;
  
  const params = {
    headers: {
      'Accept': 'text/event-stream',
      'X-Mock-User': 'true',
    },
    timeout: '30s',
  };

  const response = http.get(url, params);

  // Assert successful connection negotiation
  check(response, {
    'is status 200': (r) => r.status === 200,
    'is event-stream content type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
    'is connection keep-alive': (r) => 
      r.headers['Connection'] && r.headers['Connection'].includes('keep-alive'),
  });

  // Stay connected for 5 seconds to simulate streaming reading time
  sleep(5);
}
