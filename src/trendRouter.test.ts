import express, { Express } from 'express';
import request from 'supertest';
import { routewatch, clearRecords } from './middleware';
import { createTrendRouter } from './trendRouter';
import { RouteRecord } from './types';

function buildApp(): Express {
  const app = express();
  app.use(routewatch());
  app.get('/api/users', (_req, res) => res.json([]));
  app.post('/api/users', (_req, res) => res.status(201).json({}));
  app.use('/__trends__', createTrendRouter());
  return app;
}

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    route: '/api/users',
    path: '/api/users',
    status: 200,
    duration: 10,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('createTrendRouter', () => {
  beforeEach(() => clearRecords());

  it('GET /trends returns empty array when no records', async () => {
    const app = buildApp();
    const res = await request(app).get('/__trends__/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /trends returns trend data after requests', async () => {
    const app = buildApp();
    await request(app).get('/api/users');
    await request(app).get('/api/users');
    const res = await request(app).get('/__trends__/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const trend = res.body.find((t: any) => t.method === 'GET' && t.route === '/api/users');
    expect(trend).toBeDefined();
    expect(trend.points.length).toBeGreaterThan(0);
    expect(trend.points[0]).toHaveProperty('count');
    expect(trend.points[0]).toHaveProperty('avgDuration');
    expect(trend.points[0]).toHaveProperty('errorRate');
  });

  it('GET /trends returns 400 for invalid bucketMs', async () => {
    const app = buildApp();
    const res = await request(app).get('/__trends__/?bucketMs=-1');
    expect(res.status).toBe(400);
  });

  it('GET /trends/:method/:route returns 404 for unknown route', async () => {
    const app = buildApp();
    const res = await request(app).get('/__trends__/GET/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /trends/:method/:route returns trend for specific route', async () => {
    const app = buildApp();
    await request(app).post('/api/users');
    const res = await request(app).get('/__trends__/POST/api/users');
    expect(res.status).toBe(200);
    expect(res.body.method).toBe('POST');
    expect(res.body.route).toBe('/api/users');
    expect(Array.isArray(res.body.points)).toBe(true);
  });
});
