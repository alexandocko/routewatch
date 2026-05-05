import express, { Express } from 'express';
import request from 'supertest';
import { routewatch, clearRecords } from './middleware';
import { clearReplayHistory } from './replay';
import { createReplayRouter } from './replayRouter';

function buildApp(): Express {
  const app = express();
  app.use(routewatch());
  app.get('/api/hello', (_req, res) => res.json({ hello: true }));
  app.use('/_rw/replay', createReplayRouter({ baseUrl: 'http://127.0.0.1' }));
  return app;
}

describe('replayRouter', () => {
  let app: Express;

  beforeEach(() => {
    clearRecords();
    clearReplayHistory();
    app = buildApp();
    global.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true });
  });

  it('GET /_rw/replay returns empty array initially', async () => {
    const res = await request(app).get('/_rw/replay');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /_rw/replay/:index replays a recorded request', async () => {
    await request(app).get('/api/hello');
    const res = await request(app).post('/_rw/replay/0');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      statusCode: 200,
    });
  });

  it('POST /_rw/replay/:index returns 404 for missing index', async () => {
    const res = await request(app).post('/_rw/replay/99');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('GET /_rw/replay lists history after replay', async () => {
    await request(app).get('/api/hello');
    await request(app).post('/_rw/replay/0');
    const res = await request(app).get('/_rw/replay');
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('id');
  });

  it('DELETE /_rw/replay clears replay history', async () => {
    await request(app).get('/api/hello');
    await request(app).post('/_rw/replay/0');
    const del = await request(app).delete('/_rw/replay');
    expect(del.body.cleared).toBe(true);
    const res = await request(app).get('/_rw/replay');
    expect(res.body).toHaveLength(0);
  });
});
