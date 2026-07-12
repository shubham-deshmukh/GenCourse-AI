# Server-Sent Events (SSE) Load & Stress Testing

This load testing module simulates high-concurrency client connections against the Server-Sent Events (SSE) course outline stream endpoint (`/api/courses/:id/stream`) and measures memory, CPU footprints, socket behaviors, and disconnection cleaning performance.

---

## Test Scopes & Metric Targets

### 1. High Concurrency Connections
* Spawns 100+ concurrent asynchronous HTTP client streams.
* Measures initial socket connection latencies and validates that headers (`Content-Type: text/event-stream`, `Connection: keep-alive`) are correctly negotiated.

### 2. Live Data Footprint Tracking
* Measures Express process CPU utilization and RSS Memory footprint before, during, and after high-volume SSE streaming.

### 3. Leak Protection & Clean Teardowns
* Simulates sudden premature client aborts (cancellations).
* Verifies that event-listener subscription bounds return cleanly to initial states, ensuring no dangling database queries or memory footprint leaks.

---

## Run Load Testing

### 1. Programmatic Node.js Test (Isolated, Database-Free)
Run the programmatic load test script:
```bash
cd backend
node load-test.js
```

### 2. k6 Integration Test (Requires local k6 CLI installed)
Start the Express server on localhost:5000, then execute the k6 script:
```bash
cd backend
k6 run load-test-k6.js
```
