# Load Test Report - Backend API

## Test Information

- Test date: 2026-06-08
- Tool: Autocannon 8.0.0
- Environment: Local Windows
- Backend base URL: http://localhost:6969
- Endpoint under test: GET /api/v1/health

## Objective

Evaluate backend API behavior under concurrent HTTP requests. The first scenario uses the health check endpoint as a baseline because it is lightweight and does not write data.

## Test Scenarios

| Scenario | Endpoint | Connections | Duration | Avg Latency | P99 Latency | Max Latency | Avg Req/Sec | Total Requests | Errors |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline | GET /api/v1/health | 10 | 10s | 3.79 ms | 24 ms | 71 ms | 2,325.81 | 23k | 0 |
| Medium Load | GET /api/v1/health | 100 | 10s | 46.58 ms | 265 ms | 350 ms | 2,116.7 | 21,163 | 0 |

## Raw Results

| Scenario | File |
|---|---|
| Baseline - health c10 d10 | results/health-c10-d10.json |
| Medium Load - health c100 d10 | results/health-c100-d10.json |

## Observation

The health endpoint responded quickly under 10 concurrent connections. Average latency was low, and no request errors were reported by Autocannon.

At 100 concurrent connections, the endpoint handled 21,163 successful responses in 10.08 seconds. Average latency increased to 46.58 ms, while p99 latency reached 265 ms. No errors, timeouts, non-2xx responses, or connection resets were reported in the saved JSON result.

## Limitation

This result only represents a lightweight health check endpoint on a local development machine. It does not represent authenticated APIs, database-heavy APIs, or write operations.

## Next Steps

- Run the same endpoint with 500 concurrent connections.
- Run the same endpoint with 1000 concurrent connections.
- Compare latency, throughput, total requests, and errors across scenarios.
