import type {
  RouteRecord,
  RouteStats,
  RouteWatchOptions,
  DashboardPayload,
} from './types';

// ---------------------------------------------------------------------------
// Compile-time shape tests — if these assignments type-check, the interfaces
// are correctly defined.  Runtime assertions give Jest something to report.
// ---------------------------------------------------------------------------

describe('RouteRecord', () => {
  it('accepts a valid record object', () => {
    const record: RouteRecord = {
      method: 'GET',
      path: '/api/users',
      statusCode: 200,
      durationMs: 42,
      timestamp: Date.now(),
    };
    expect(record.method).toBe('GET');
    expect(record.statusCode).toBe(200);
  });
});

describe('RouteStats', () => {
  it('accepts a valid stats object', () => {
    const stats: RouteStats = {
      method: 'POST',
      path: '/api/items',
      count: 5,
      avgDurationMs: 30,
      minDurationMs: 10,
      maxDurationMs: 80,
      statusCodes: { 201: 4, 400: 1 },
      lastCalledAt: Date.now(),
    };
    expect(stats.count).toBe(5);
    expect(stats.statusCodes[201]).toBe(4);
  });
});

describe('RouteWatchOptions', () => {
  it('allows all fields to be optional', () => {
    const opts: RouteWatchOptions = {};
    expect(opts.maxRecords).toBeUndefined();
    expect(opts.dashboardPath).toBeUndefined();
    expect(opts.verbose).toBeUndefined();
  });

  it('accepts fully specified options', () => {
    const opts: RouteWatchOptions = {
      maxRecords: 500,
      dashboardPath: '/__dev/routes',
      verbose: true,
    };
    expect(opts.maxRecords).toBe(500);
    expect(opts.verbose).toBe(true);
  });
});

describe('DashboardPayload', () => {
  it('accepts a valid payload', () => {
    const payload: DashboardPayload = {
      generatedAt: Date.now(),
      totalRequests: 100,
      routes: [],
    };
    expect(payload.totalRequests).toBe(100);
    expect(Array.isArray(payload.routes)).toBe(true);
  });
});
