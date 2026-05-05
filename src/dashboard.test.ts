import request from 'supertest';
import express from 'express';
import { routewatch, clearRecords } from './middleware';
import { createDashboardRouter, computeStats } from './dashboard';

function buildApp() {
  const app = express();
  app.use(routewatch());
  app.get('/api/users', (_req, res) => res.json([]));
  app.post('/api/users', (_req, res) => res.status(201).json({ id: 1 }));
  app.use(createDashboardRouter());
  return app;
}

describe('dashboard', () => {
  let app: express.Express;

  beforeEach(() => {
    clearRecords();
    app = buildApp();
  });

  describe('computeStats()', () => {
    it('returns empty array when no requests recorded', () => {
      expect(computeStats()).toEqual([]);
    });

    it('aggregates counts per route', async () => {
      await request(app).get('/api/users');
      await request(app).get('/api/users');
      await request(app).post('/api/users');

      const stats = computeStats();
      const getRoute = stats.find((s) => s.method === 'GET' && s.path === '/api/users');
      const postRoute = stats.find((s) => s.method === 'POST' && s.path === '/api/users');

      expect(getRoute?.count).toBe(2);
      expect(postRoute?.count).toBe(1);
    });

    it('tracks status codes', async () => {
      await request(app).get('/api/users');
      await request(app).post('/api/users');

      const stats = computeStats();
      const getRoute = stats.find((s) => s.method === 'GET');
      const postRoute = stats.find((s) => s.method === 'POST');

      expect(getRoute?.statusCodes[200]).toBe(1);
      expect(postRoute?.statusCodes[201]).toBe(1);
    });

    it('sorts by count descending', async () => {
      await request(app).post('/api/users');
      await request(app).get('/api/users');
      await request(app).get('/api/users');

      const stats = computeStats();
      expect(stats[0].count).toBeGreaterThanOrEqual(stats[1].count);
    });
  });

  describe('GET /routewatch', () => {
    it('returns 200 with html content', async () => {
      const res = await request(app).get('/routewatch');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('RouteWatch Dashboard');
    });

    it('renders table rows for recorded routes', async () => {
      await request(app).get('/api/users');
      const res = await request(app).get('/routewatch');
      expect(res.text).toContain('/api/users');
    });
  });

  describe('GET /routewatch/json', () => {
    it('returns json stats array', async () => {
      await request(app).get('/api/users');
      const res = await request(app).get('/routewatch/json');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('method');
      expect(res.body[0]).toHaveProperty('count');
    });
  });
});
