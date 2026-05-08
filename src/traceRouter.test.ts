import express from 'express';
import request from 'supertest';
import { createTraceRouter } from './traceRouter';
import { recordTrace, clearTraces } from './trace';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/items',
    statusCode: 200,
    duration: 80,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/__routewatch__', createTraceRouter());
  return app;
}

beforeEach(() => clearTraces());

describe('GET /__routewatch__/traces', () => {
  it('returns empty list when no traces', async () => {
    const res = await request(buildApp()).get('/__routewatch__/traces');
    expect(res.status).toBe(200);
    expect(res.body.traceIds).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns distinct trace ids', async () => {
    recordTrace(makeRecord(), 'trace-1');
    recordTrace(makeRecord(), 'trace-2');
    recordTrace(makeRecord(), 'trace-1');
    const res = await request(buildApp()).get('/__routewatch__/traces');
    expect(res.body.count).toBe(2);
  });
});

describe('GET /__routewatch__/traces/entries', () => {
  it('returns all entries without filter', async () => {
    recordTrace(makeRecord(), 'a');
    recordTrace(makeRecord(), 'b');
    const res = await request(buildApp()).get('/__routewatch__/traces/entries');
    expect(res.body.count).toBe(2);
  });

  it('filters entries by traceId query param', async () => {
    recordTrace(makeRecord({ path: '/x' }), 'trace-x');
    recordTrace(makeRecord({ path: '/y' }), 'trace-y');
    const res = await request(buildApp())
      .get('/__routewatch__/traces/entries?traceId=trace-x');
    expect(res.body.count).toBe(1);
    expect(res.body.entries[0].path).toBe('/x');
  });
});

describe('GET /__routewatch__/traces/:traceId', () => {
  it('returns 404 for unknown traceId', async () => {
    const res = await request(buildApp()).get('/__routewatch__/traces/nope');
    expect(res.status).toBe(404);
  });

  it('returns entries and stats for known traceId', async () => {
    recordTrace(makeRecord({ duration: 100, statusCode: 200 }), 'trace-abc');
    recordTrace(makeRecord({ duration: 200, statusCode: 500 }), 'trace-abc');
    const res = await request(buildApp()).get('/__routewatch__/traces/trace-abc');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.stats.errorCount).toBe(1);
    expect(res.body.stats.avgDuration).toBe(150);
  });
});

describe('DELETE /__routewatch__/traces', () => {
  it('clears all traces', async () => {
    recordTrace(makeRecord(), 'trace-del');
    const del = await request(buildApp()).delete('/__routewatch__/traces');
    expect(del.status).toBe(200);
    const list = await request(buildApp()).get('/__routewatch__/traces');
    expect(list.body.count).toBe(0);
  });
});
