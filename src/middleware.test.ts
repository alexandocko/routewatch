import express, { Express } from 'express';
import request from 'supertest';
import { routewatch, getRecords, clearRecords } from './middleware';

function buildApp(options = {}): Express {
  const app = express();
  app.use(routewatch(options));

  app.get('/hello', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/data', (_req, res) => res.status(201).json({ created: true }));
  app.get('/error', (_req, res) => res.status(500).json({ error: 'boom' }));

  return app;
}

describe('routewatch middleware', () => {
  beforeEach(() => {
    clearRecords();
  });

  it('records a GET request', async () => {
    const app = buildApp({ verbose: false });
    await request(app).get('/hello').expect(200);

    const records = getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].method).toBe('GET');
    expect(records[0].path).toBe('/hello');
    expect(records[0].statusCode).toBe(200);
    expect(typeof records[0].responseTimeMs).toBe('number');
    expect(records[0].timestamp).toBeInstanceOf(Date);
  });

  it('records multiple requests', async () => {
    const app = buildApp({ verbose: false });
    await request(app).get('/hello');
    await request(app).post('/data');

    const records = getRecords();
    expect(records).toHaveLength(2);
    expect(records[1].method).toBe('POST');
    expect(records[1].statusCode).toBe(201);
  });

  it('records error status codes', async () => {
    const app = buildApp({ verbose: false });
    await request(app).get('/error');

    const records = getRecords();
    expect(records[0].statusCode).toBe(500);
  });

  it('calls custom logger when provided', async () => {
    const customLogger = jest.fn();
    const app = buildApp({ verbose: false, logger: customLogger });
    await request(app).get('/hello');

    expect(customLogger).toHaveBeenCalledTimes(1);
    expect(customLogger).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/hello' })
    );
  });

  it('clearRecords empties the store', async () => {
    const app = buildApp({ verbose: false });
    await request(app).get('/hello');
    expect(getRecords()).toHaveLength(1);

    clearRecords();
    expect(getRecords()).toHaveLength(0);
  });
});
