import express from 'express';
import request from 'supertest';
import { createScheduleRouter } from './scheduleRouter';
import { clearSchedules } from './schedule';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/schedules', createScheduleRouter());
  return app;
}

beforeEach(() => clearSchedules());

describe('GET /schedules', () => {
  it('returns empty list initially', async () => {
    const res = await request(buildApp()).get('/schedules');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /schedules', () => {
  it('creates a schedule entry', async () => {
    const res = await request(buildApp()).post('/schedules').send({
      label: 'Hourly health check',
      cronExpression: '0 * * * *',
      route: '/health',
      method: 'GET',
    });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Hourly health check');
    expect(res.body.triggerCount).toBe(0);
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 if fields are missing', async () => {
    const res = await request(buildApp()).post('/schedules').send({ label: 'only' });
    expect(res.status).toBe(400);
  });
});

describe('GET /schedules/:id', () => {
  it('returns the schedule by id', async () => {
    const app = buildApp();
    const created = await request(app).post('/schedules').send({
      label: 'Daily report',
      cronExpression: '0 0 * * *',
      route: '/report',
      method: 'POST',
    });
    const res = await request(app).get(`/schedules/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.label).toBe('Daily report');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(buildApp()).get('/schedules/unknown');
    expect(res.status).toBe(404);
  });
});

describe('POST /schedules/:id/trigger', () => {
  it('increments triggerCount', async () => {
    const app = buildApp();
    const created = await request(app).post('/schedules').send({
      label: 'Ping',
      cronExpression: '*/5 * * * *',
      route: '/ping',
      method: 'GET',
    });
    const res = await request(app).post(`/schedules/${created.body.id}/trigger`);
    expect(res.status).toBe(200);
    expect(res.body.triggerCount).toBe(1);
    expect(res.body.lastTriggered).toBeDefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(buildApp()).post('/schedules/missing/trigger');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /schedules/:id', () => {
  it('removes a schedule', async () => {
    const app = buildApp();
    const created = await request(app).post('/schedules').send({
      label: 'Cleanup',
      cronExpression: '0 2 * * *',
      route: '/cleanup',
      method: 'DELETE',
    });
    const del = await request(app).delete(`/schedules/${created.body.id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/schedules/${created.body.id}`);
    expect(get.status).toBe(404);
  });
});
