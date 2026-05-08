import express from 'express';
import request from 'supertest';
import { createWatchlistRouter } from './watchlistRouter';
import { clearWatchlist, addToWatchlist } from './watchlist';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/watchlist', createWatchlistRouter());
  return app;
}

beforeEach(() => clearWatchlist());

describe('GET /watchlist', () => {
  it('returns empty array initially', async () => {
    const res = await request(buildApp()).get('/watchlist');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns added entries', async () => {
    addToWatchlist('GET', '/ping', 'health-check');
    const res = await request(buildApp()).get('/watchlist');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].label).toBe('health-check');
  });
});

describe('POST /watchlist', () => {
  it('adds a new entry', async () => {
    const res = await request(buildApp())
      .post('/watchlist')
      .send({ method: 'GET', path: '/api/users' });
    expect(res.status).toBe(201);
    expect(res.body.method).toBe('GET');
    expect(res.body.hitCount).toBe(0);
  });

  it('returns 400 when method or path is missing', async () => {
    const res = await request(buildApp())
      .post('/watchlist')
      .send({ method: 'GET' });
    expect(res.status).toBe(400);
  });
});

describe('GET /watchlist/:method/*', () => {
  it('returns the matching entry', async () => {
    addToWatchlist('POST', '/items');
    const res = await request(buildApp()).get('/watchlist/POST/items');
    expect(res.status).toBe(200);
    expect(res.body.path).toBe('/items');
  });

  it('returns 404 for unknown entry', async () => {
    const res = await request(buildApp()).get('/watchlist/GET/nope');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /watchlist/:method/*', () => {
  it('removes an existing entry', async () => {
    addToWatchlist('DELETE', '/items/1');
    const res = await request(buildApp()).delete('/watchlist/DELETE/items/1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    const res = await request(buildApp()).delete('/watchlist/GET/missing');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /watchlist', () => {
  it('clears all entries', async () => {
    addToWatchlist('GET', '/a');
    addToWatchlist('GET', '/b');
    const res = await request(buildApp()).delete('/watchlist');
    expect(res.status).toBe(204);
    const list = await request(buildApp()).get('/watchlist');
    expect(list.body).toHaveLength(0);
  });
});
