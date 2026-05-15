import express, { Express } from 'express';
import request from 'supertest';
import { routewatch, clearRecords } from './middleware';
import { createLatencyRouter } from './latencyRouter';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: 'id',
    method: 'GET',
    route: '/api/items',
    path: '/api/items',
    status: 200,
    duration: 100,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(routewatch());
  app.use('/latency', createLatencyRouter());
  app.get('/api/items', (_req, res) => res.json([]));
  return app;
}

beforeEach(() => clearRecords());

describe('GET /latency', () => {
  it('returns empty buckets when no records', async () => {
    const app = buildApp();
    const res = await request(app).get('/latency');
    expect(res.status).toBe(200);
    expect(res.body.buckets).toEqual([]);
    expect(res.body.overall.count).toBe(0);
  });

  it('returns latency stats after requests', async () => {
    const app = buildApp();
    await request(app).get('/api/items');
    await request(app).get('/api/items');
    const res = await request(app).get('/latency');
    expect(res.status).toBe(200);
    expect(res.body.buckets.length).toBeGreaterThan(0);
    expect(res.body.overall.count).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /latency/summary', () => {
  it('returns overall latency summary', async () => {
    const app = buildApp();
    await request(app).get('/api/items');
    const res = await request(app).get('/latency/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('p50');
    expect(res.body).toHaveProperty('p99');
    expect(res.body).toHaveProperty('count');
  });
});

describe('GET /latency/route/:route', () => {
  it('returns 404 for unknown route', async () => {
    const app = buildApp();
    const res = await request(app).get('/latency/route/api/unknown');
    expect(res.status).toBe(404);
  });

  it('returns stats for known route', async () => {
    const app = buildApp();
    await request(app).get('/api/items');
    const res = await request(app).get('/latency/route/api/items');
    expect(res.status).toBe(200);
    expect(res.body.buckets[0].route).toBe('/api/items');
  });
});
