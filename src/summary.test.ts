import { buildSummary } from './summary';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 50,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    ...overrides,
  };
}

describe('buildSummary', () => {
  it('returns zero totals for empty records', () => {
    const report = buildSummary([]);
    expect(report.totalRequests).toBe(0);
    expect(report.uniqueRoutes).toBe(0);
    expect(report.overallAvgDurationMs).toBe(0);
    expect(report.errorRate).toBe(0);
    expect(report.routes).toHaveLength(0);
  });

  it('correctly aggregates a single route', () => {
    const records = [
      makeRecord({ durationMs: 100 }),
      makeRecord({ durationMs: 200 }),
      makeRecord({ durationMs: 300 }),
    ];
    const report = buildSummary(records);

    expect(report.totalRequests).toBe(3);
    expect(report.uniqueRoutes).toBe(1);
    expect(report.overallAvgDurationMs).toBeCloseTo(200);
    expect(report.routes[0].avgDurationMs).toBeCloseTo(200);
    expect(report.routes[0].minDurationMs).toBe(100);
    expect(report.routes[0].maxDurationMs).toBe(300);
    expect(report.routes[0].count).toBe(3);
  });

  it('calculates error rate correctly', () => {
    const records = [
      makeRecord({ statusCode: 200 }),
      makeRecord({ statusCode: 500 }),
      makeRecord({ statusCode: 404 }),
      makeRecord({ statusCode: 200 }),
    ];
    const report = buildSummary(records);

    expect(report.errorRate).toBeCloseTo(0.5);
    expect(report.routes[0].errorRate).toBeCloseTo(0.5);
  });

  it('groups by method and path separately', () => {
    const records = [
      makeRecord({ method: 'GET', path: '/users' }),
      makeRecord({ method: 'POST', path: '/users' }),
      makeRecord({ method: 'GET', path: '/users' }),
    ];
    const report = buildSummary(records);

    expect(report.uniqueRoutes).toBe(2);
    const getRoute = report.routes.find((r) => r.method === 'GET' && r.path === '/users');
    expect(getRoute?.count).toBe(2);
  });

  it('sorts routes by count descending', () => {
    const records = [
      makeRecord({ path: '/rare' }),
      makeRecord({ path: '/popular' }),
      makeRecord({ path: '/popular' }),
      makeRecord({ path: '/popular' }),
    ];
    const report = buildSummary(records);

    expect(report.routes[0].path).toBe('/popular');
    expect(report.routes[1].path).toBe('/rare');
  });

  it('tracks lastCalledAt as the most recent timestamp', () => {
    const records = [
      makeRecord({ timestamp: new Date('2024-01-01T08:00:00Z') }),
      makeRecord({ timestamp: new Date('2024-01-01T12:00:00Z') }),
      makeRecord({ timestamp: new Date('2024-01-01T10:00:00Z') }),
    ];
    const report = buildSummary(records);

    expect(report.routes[0].lastCalledAt?.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });
});
