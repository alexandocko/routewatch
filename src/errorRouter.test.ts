import express, { Application } from 'express';
import request from 'supertest';
import { createErrorRouter } from './errorRouter';
import { recordError, clearErrorLog } from './errorTracker';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 500,
    durationMs: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp(): Application {
  const app = express();
  app.use('/routewatch', createErrorRouter());
  return app;
}

beforeEach(() => {
  clearErrorLog();
});

describe('GET /routewatch/errors', () => {
  it('returns empty list when no errors recorded', async () => {
    const res = await request(buildApp()).get('/routewatch/errors');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.entries).toEqual([]);
  });

  it('returns recorded error entries', async () => {
    recordError(makeRecord({ statusCode: 404, path: '/missing' }));
    recordError(makeRecord({ statusCode: 500, path: '/boom' }));
    const res = await request(buildApp()).get('/routewatch/errors');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('increments count for duplicate route+status', async () => {
    recordError(makeRecord({ statusCode: 500, path: '/boom' }));
    recordError(makeRecord({ statusCode: 500, path: '/boom' }));
    const res = await request(buildApp()).get('/routewatch/errors');
    expect(res.body.count).toBe(1);
    expect(res.body.entries[0].count).toBe(2);
  });
});

describe('GET /routewatch/errors/summary', () => {
  it('returns totals and byStatus breakdown', async () => {
    recordError(makeRecord({ statusCode: 500 }));
    recordError(makeRecord({ statusCode: 404 }));
    recordError(makeRecord({ statusCode: 500 }));
    const res = await request(buildApp()).get('/routewatch/errors/summary');
    expect(res.status).toBe(200);
    expect(res.body.totalErrors).toBe(3);
    expect(res.body.byStatus['500']).toBe(2);
    expect(res.body.byStatus['404']).toBe(1);
    expect(res.body.topRoutes).toBeDefined();
  });
});

describe('DELETE /routewatch/errors', () => {
  it('clears the error log', async () => {
    recordError(makeRecord());
    const res = await request(buildApp()).delete('/routewatch/errors');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cleared/i);
    const check = await request(buildApp()).get('/routewatch/errors');
    expect(check.body.count).toBe(0);
  });
});
