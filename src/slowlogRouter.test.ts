import express, { Express } from 'express';
import request from 'supertest';
import { createSlowlogRouter } from './slowlogRouter';
import { recordSlowlog, clearSlowlog } from './slowlog';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    duration: 800,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

function buildApp(): Express {
  const app = express();
  app.use('/slowlog', createSlowlogRouter({ threshold: 500 }));
  return app;
}

describe('slowlogRouter', () => {
  beforeEach(() => clearSlowlog());

  describe('GET /slowlog', () => {
    it('returns empty entries when no slow requests', async () => {
      const res = await request(buildApp()).get('/slowlog');
      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(0);
      expect(res.body.threshold).toBe(500);
    });

    it('returns recorded slow entries', async () => {
      recordSlowlog(makeRecord({ duration: 900, path: '/api/slow' }));
      const res = await request(buildApp()).get('/slowlog');
      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0].path).toBe('/api/slow');
    });

    it('includes stats in response', async () => {
      recordSlowlog(makeRecord({ duration: 700 }));
      const res = await request(buildApp()).get('/slowlog');
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.count).toBe(1);
    });
  });

  describe('GET /slowlog/stats', () => {
    it('returns stats object', async () => {
      recordSlowlog(makeRecord({ duration: 600 }));
      recordSlowlog(makeRecord({ duration: 1200, path: '/api/other' }));
      const res = await request(buildApp()).get('/slowlog/stats');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.maxDuration).toBe(1200);
    });
  });

  describe('DELETE /slowlog', () => {
    it('clears all slowlog entries', async () => {
      recordSlowlog(makeRecord({ duration: 900 }));
      const del = await request(buildApp()).delete('/slowlog');
      expect(del.status).toBe(200);
      expect(del.body.cleared).toBe(true);

      const get = await request(buildApp()).get('/slowlog');
      expect(get.body.entries).toHaveLength(0);
    });
  });
});
