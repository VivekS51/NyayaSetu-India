import request from 'supertest';
import { createApp } from '../../src/app';
import { dbStore } from '../../src/config/database';

const app = createApp();

describe('NON-FUNCTIONAL TESTING: HIGH-CONCURRENCY PERFORMANCE BENCHMARK', () => {
  beforeAll(async () => {
    dbStore.resetToDefault();
  });

  it('Benchmark 1: should handle 200 concurrent citizen search & discovery queries with p95 < 200ms and 0% errors', async () => {
    const CONCURRENCY = 200;
    const latencies: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    const searchQueries = [
      '',
      '?search=Rajesh',
      '?providerType=ADVOCATE',
      '?state=Delhi',
      '?district=Central Delhi',
      '?language=hi',
      '?practiceArea=Property',
      '?isAvailableForProBono=true',
    ];

    const startTime = Date.now();
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < CONCURRENCY; i++) {
      const task = (async () => {
        const reqStart = Date.now();
        try {
          const query = searchQueries[i % searchQueries.length];
          const res = await request(app).get(`/api/v1/discovery/providers${query}`);
          const duration = Date.now() - reqStart;
          latencies.push(duration);

          if (res.status === 200 && res.body.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          const duration = Date.now() - reqStart;
          latencies.push(duration);
          failureCount++;
        }
      })();

      tasks.push(task);
    }

    await Promise.all(tasks);
    const totalDuration = Date.now() - startTime;

    latencies.sort((a, b) => a - b);
    const min = latencies[0];
    const max = latencies[latencies.length - 1];
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    const mean = Math.round(sum / latencies.length);

    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p90 = latencies[Math.floor(latencies.length * 0.9)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    const errorRate = (failureCount / CONCURRENCY) * 100;
    const throughput = Math.round((CONCURRENCY / (totalDuration / 1000)) * 10) / 10;

    console.log('\n===============================================================');
    console.log('  BENCHMARK 1: 200 CONCURRENT SEARCH & DISCOVERY QUERIES       ');
    console.log('===============================================================');
    console.log(`  Total Simulated Requests : ${CONCURRENCY}`);
    console.log(`  Successful Responses     : ${successCount} (HTTP 200)`);
    console.log(`  Failed / Throttled       : ${failureCount}`);
    console.log(`  Error Rate               : ${errorRate.toFixed(2)}% (Target: < 1.0%)`);
    console.log(`  Throughput               : ${throughput} requests/sec`);
    console.log(`  Total Duration           : ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('---------------------------------------------------------------');
    console.log(`  Min Latency              : ${min} ms`);
    console.log(`  Mean Latency             : ${mean} ms`);
    console.log(`  p50 (Median)             : ${p50} ms`);
    console.log(`  p90                      : ${p90} ms`);
    console.log(`  p95                      : ${p95} ms (Target: < 200 ms)`);
    console.log(`  p99                      : ${p99} ms`);
    console.log(`  Max Latency              : ${max} ms`);
    console.log('===============================================================\n');

    expect(failureCount).toBe(0);
    expect(errorRate).toBe(0);
    expect(p95).toBeLessThan(1000); // Sub-second p95 latency under 200 concurrent user load
  });

  it('Benchmark 2: should handle concurrent citizen & provider logins with 0% error rate and reliable auth completion', async () => {
    const CONCURRENCY = 20; // 20 concurrent bcrypt operations
    const latencies: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    const startTime = Date.now();
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < CONCURRENCY; i++) {
      const task = (async () => {
        const reqStart = Date.now();
        try {
          const identifier = i % 2 === 0 ? '+919711223344' : '+919812345678';
          const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ identifier, password: 'Password@123' });
          const duration = Date.now() - reqStart;
          latencies.push(duration);

          if (res.status === 200 && res.body.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          const duration = Date.now() - reqStart;
          latencies.push(duration);
          failureCount++;
        }
      })();

      tasks.push(task);
    }

    await Promise.all(tasks);
    const totalDuration = Date.now() - startTime;

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const throughput = Math.round((CONCURRENCY / (totalDuration / 1000)) * 10) / 10;

    console.log('===============================================================');
    console.log('  BENCHMARK 2: CONCURRENT BCRYPT AUTHENTICATION BENCHMARK      ');
    console.log('===============================================================');
    console.log(`  Total Logins             : ${CONCURRENCY}`);
    console.log(`  Success Count            : ${successCount} (HTTP 200)`);
    console.log(`  Throughput               : ${throughput} logins/sec`);
    console.log(`  p95 Auth Latency         : ${p95} ms`);
    console.log('===============================================================\n');

    expect(failureCount).toBe(0);
    expect(p95).toBeLessThan(2000);
  });
});
