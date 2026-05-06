import { computeHeatmap } from './heatmap';
import { RouteRecord } from './types';

function makeRecord(
  path: string,
  method: string,
  timestamp: number,
  overrides: Partial<RouteRecord> = {}
): RouteRecord {
  return {
    id: Math.random().toString(36).slice(2),
    path,
    method,
    statusCode: 200,
    duration: 10,
    timestamp,
    tags: [],
    ...overrides,
  };
}

// Monday 2024-01-08 at 14:30 UTC
const MON_14 = new Date('2024-01-08T14:30:00.000Z').getTime();
// Monday 2024-01-08 at 14:45 UTC
const MON_14b = new Date('2024-01-08T14:45:00.000Z').getTime();
// Wednesday 2024-01-10 at 09:00 UTC
const WED_09 = new Date('2024-01-10T09:00:00.000Z').getTime();
// Saturday 2024-01-13 at 23:00 UTC
const SAT_23 = new Date('2024-01-13T23:00:00.000Z').getTime();

describe('computeHeatmap', () => {
  const records: RouteRecord[] = [
    makeRecord('/api/users', 'GET', MON_14),
    makeRecord('/api/users', 'GET', MON_14b),
    makeRecord('/api/orders', 'POST', WED_09),
    makeRecord('/api/users', 'GET', SAT_23),
  ];

  it('returns 168 cells (7 days x 24 hours)', () => {
    const result = computeHeatmap(records);
    expect(result.cells).toHaveLength(168);
  });

  it('counts all requests when no filter applied', () => {
    const result = computeHeatmap(records);
    expect(result.totalRequests).toBe(4);
  });

  it('accumulates counts in correct day/hour bucket', () => {
    const result = computeHeatmap(records);
    const monDate = new Date(MON_14);
    const day = monDate.getDay();
    const hour = monDate.getHours();
    const cell = result.cells.find((c) => c.day === day && c.hour === hour);
    expect(cell?.count).toBe(2);
  });

  it('reports correct maxCount', () => {
    const result = computeHeatmap(records);
    expect(result.maxCount).toBe(2);
  });

  it('filters by route', () => {
    const result = computeHeatmap(records, '/api/orders');
    expect(result.totalRequests).toBe(1);
    const wedDate = new Date(WED_09);
    const cell = result.cells.find(
      (c) => c.day === wedDate.getDay() && c.hour === wedDate.getHours()
    );
    expect(cell?.count).toBe(1);
  });

  it('filters by method', () => {
    const result = computeHeatmap(records, undefined, 'POST');
    expect(result.totalRequests).toBe(1);
  });

  it('filters by route and method together', () => {
    const result = computeHeatmap(records, '/api/users', 'POST');
    expect(result.totalRequests).toBe(0);
    expect(result.maxCount).toBe(0);
  });

  it('returns maxCount 0 for empty records', () => {
    const result = computeHeatmap([]);
    expect(result.maxCount).toBe(0);
    expect(result.totalRequests).toBe(0);
  });
});
