import { detectAnomalies, AnomalyEntry } from './anomaly';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: Math.random().toString(36).slice(2),
    method: 'GET',
    route: '/api/test',
    path: '/api/test',
    statusCode: 200,
    duration: 50,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

describe('detectAnomalies', () => {
  it('returns empty array for no records', () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it('flags no outliers when durations are uniform', () => {
    const records = [50, 52, 48, 51, 49].map((d) =>
      makeRecord({ duration: d })
    );
    const results = detectAnomalies(records);
    expect(results).toHaveLength(1);
    expect(results[0].flagged).toBe(false);
    expect(results[0].outliers).toHaveLength(0);
  });

  it('detects a spike as an outlier', () => {
    const durations = [50, 52, 48, 51, 49, 500];
    const records = durations.map((d) => makeRecord({ duration: d }));
    const results = detectAnomalies(records);
    expect(results[0].flagged).toBe(true);
    expect(results[0].outliers).toContain(500);
  });

  it('groups by route and method', () => {
    const records = [
      makeRecord({ method: 'GET', route: '/a', duration: 50 }),
      makeRecord({ method: 'GET', route: '/a', duration: 55 }),
      makeRecord({ method: 'POST', route: '/b', duration: 100 }),
      makeRecord({ method: 'POST', route: '/b', duration: 105 }),
    ];
    const results = detectAnomalies(records);
    expect(results).toHaveLength(2);
    const routes = results.map((r) => r.route);
    expect(routes).toContain('/a');
    expect(routes).toContain('/b');
  });

  it('respects custom multiplier', () => {
    const durations = [50, 52, 48, 51, 49, 120];
    const records = durations.map((d) => makeRecord({ duration: d }));
    const strictResults = detectAnomalies(records, 1.0);
    const looseResults = detectAnomalies(records, 10.0);
    expect(strictResults[0].flagged).toBe(true);
    expect(looseResults[0].flagged).toBe(false);
  });

  it('computes avgDuration and stdDev correctly', () => {
    const records = [10, 20, 30].map((d) => makeRecord({ duration: d }));
    const results = detectAnomalies(records);
    expect(results[0].avgDuration).toBeCloseTo(20, 1);
    expect(results[0].stdDev).toBeCloseTo(10, 1);
  });

  it('sorts results by number of outliers descending', () => {
    const records = [
      makeRecord({ route: '/a', duration: 50 }),
      makeRecord({ route: '/a', duration: 51 }),
      makeRecord({ route: '/a', duration: 1000 }),
      makeRecord({ route: '/a', duration: 900 }),
      makeRecord({ route: '/b', duration: 100 }),
      makeRecord({ route: '/b', duration: 102 }),
    ];
    const results = detectAnomalies(records);
    expect(results[0].outliers.length).toBeGreaterThanOrEqual(
      results[results.length - 1].outliers.length
    );
  });
});
