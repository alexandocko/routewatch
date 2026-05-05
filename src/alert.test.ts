import { evaluateAlerts, AlertRule } from './alert';
import { RouteRecord } from './types';

function makeRecord(
  path: string,
  method: string,
  statusCode: number,
  duration: number
): RouteRecord {
  return { path, method, statusCode, duration, timestamp: Date.now() };
}

const sampleRecords: RouteRecord[] = [
  makeRecord('/api/users', 'GET', 200, 50),
  makeRecord('/api/users', 'GET', 200, 80),
  makeRecord('/api/users', 'GET', 500, 200),
  makeRecord('/api/orders', 'POST', 201, 120),
  makeRecord('/api/orders', 'POST', 422, 90),
];

describe('evaluateAlerts', () => {
  it('returns no results when rules array is empty', () => {
    const results = evaluateAlerts(sampleRecords, []);
    expect(results).toHaveLength(0);
  });

  it('triggers maxCount alert when threshold exceeded', () => {
    const rules: AlertRule[] = [{ route: '/api/users', method: 'GET', maxCount: 2 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results).toHaveLength(1);
    expect(results[0].triggered).toBe(true);
    expect(results[0].message).toMatch(/count 3 exceeds maxCount 2/);
  });

  it('does not trigger maxCount when count is within limit', () => {
    const rules: AlertRule[] = [{ route: '/api/users', method: 'GET', maxCount: 5 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results).toHaveLength(0);
  });

  it('triggers maxAvgDuration alert', () => {
    const rules: AlertRule[] = [{ route: '/api/users', method: 'GET', maxAvgDuration: 100 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results).toHaveLength(1);
    expect(results[0].message).toMatch(/avgDuration/);
  });

  it('triggers minSuccessRate alert', () => {
    const rules: AlertRule[] = [{ route: '/api/users', method: 'GET', minSuccessRate: 0.9 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results).toHaveLength(1);
    expect(results[0].message).toMatch(/successRate/);
  });

  it('matches all routes when no route/method filter specified', () => {
    const rules: AlertRule[] = [{ maxCount: 1 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty when no records match the filter', () => {
    const rules: AlertRule[] = [{ route: '/nonexistent', maxCount: 1 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results).toHaveLength(0);
  });

  it('includes actual values in the result', () => {
    const rules: AlertRule[] = [{ route: '/api/orders', method: 'POST', maxCount: 1 }];
    const results = evaluateAlerts(sampleRecords, rules);
    expect(results[0].actual).toMatchObject({ count: 2 });
    expect(results[0].actual.avgDuration).toBeCloseTo(105, 0);
  });
});
