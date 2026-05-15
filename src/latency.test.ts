import { computeLatency } from './latency';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: 'test-id',
    method: 'GET',
    route: '/api/test',
    path: '/api/test',
    status: 200,
    duration: 100,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

describe('computeLatency', () => {
  it('returns empty buckets for no records', () => {
    const result = computeLatency([]);
    expect(result.buckets).toHaveLength(0);
    expect(result.overall.count).toBe(0);
  });

  it('computes percentiles for a single route', () => {
    const records = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((d) =>
      makeRecord({ duration: d })
    );
    const result = computeLatency(records);
    expect(result.buckets).toHaveLength(1);
    const b = result.buckets[0];
    expect(b.min).toBe(10);
    expect(b.max).toBe(100);
    expect(b.p50).toBe(50);
    expect(b.p99).toBe(100);
    expect(b.count).toBe(10);
  });

  it('groups by method and route', () => {
    const records = [
      makeRecord({ method: 'GET', route: '/a', duration: 50 }),
      makeRecord({ method: 'POST', route: '/a', duration: 200 }),
      makeRecord({ method: 'GET', route: '/a', duration: 100 }),
    ];
    const result = computeLatency(records);
    expect(result.buckets).toHaveLength(2);
    const getA = result.buckets.find((b) => b.method === 'GET');
    expect(getA?.count).toBe(2);
    expect(getA?.min).toBe(50);
    expect(getA?.max).toBe(100);
  });

  it('sorts buckets by p99 descending', () => {
    const records = [
      makeRecord({ route: '/slow', duration: 900 }),
      makeRecord({ route: '/fast', duration: 10 }),
    ];
    const result = computeLatency(records);
    expect(result.buckets[0].route).toBe('/slow');
  });

  it('computes overall stats across all records', () => {
    const records = [
      makeRecord({ route: '/a', duration: 10 }),
      makeRecord({ route: '/b', duration: 90 }),
    ];
    const result = computeLatency(records);
    expect(result.overall.count).toBe(2);
    expect(result.overall.min).toBe(10);
    expect(result.overall.max).toBe(90);
  });
});
