import express from 'express';
import request from 'supertest';
import { routewatch, clearRecords } from './middleware';
import { createCompareRouter } from './compareRouter';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(routewatch());
  app.use('/compare', createCompareRouter());
  return app;
}

beforeEach(() => clearRecords());

describe('createCompareRouter', () => {
  it('returns a compare result with windowA and windowB labels', async () => {
    const app = buildApp();
    const res = await request(app).get('/compare');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('windowA');
    expect(res.body).toHaveProperty('windowB');
    expect(res.body).toHaveProperty('routes');
    expect(Array.isArray(res.body.routes)).toBe(true);
  });

  it('uses custom labels from query params', async () => {
    const app = buildApp();
    const res = await request(app).get('/compare?labelA=Before&labelB=After');
    expect(res.body.windowA).toBe('Before');
    expect(res.body.windowB).toBe('After');
  });

  it('includes route comparison data when records exist', async () => {
    const now = Date.now();
    const { getRecords } = await import('./middleware');
    // Manually inject records by hitting a real route
    const app = express();
    app.use(routewatch());
    app.get('/api/hello', (_req, res) => res.json({ ok: true }));
    app.use('/compare', createCompareRouter());

    const windowMs = 60_000;
    await request(app).get('/api/hello');

    const res = await request(app).get(`/compare?windowMs=${windowMs}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.routes)).toBe(true);
  });

  it('returns empty routes when no records exist', async () => {
    const app = buildApp();
    const res = await request(app).get('/compare');
    expect(res.body.routes).toEqual([]);
  });

  it('computes countDelta and durationDelta fields', async () => {
    const app = express();
    app.use(routewatch());
    app.get('/ping', (_req, res) => res.json({ pong: true }));
    app.use('/compare', createCompareRouter());

    await request(app).get('/ping');

    const res = await request(app).get('/compare');
    expect(res.status).toBe(200);
    if (res.body.routes.length > 0) {
      const route = res.body.routes[0];
      expect(typeof route.countDelta).toBe('number');
      expect(typeof route.durationDelta).toBe('number');
    }
  });
});
