import express from 'express';
import request from 'supertest';
import { clearCircuitRules } from './circuit';
import { createCircuitRouter } from './circuitRouter';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/circuit', createCircuitRouter());
  return app;
}

beforeEach(() => clearCircuitRules());

test('GET /circuit/rules returns empty array initially', async () => {
  const res = await request(buildApp()).get('/circuit/rules');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('POST /circuit/rules creates a rule', async () => {
  const res = await request(buildApp())
    .post('/circuit/rules')
    .send({ id: 'r1', route: '/api/test', method: 'GET', errorThreshold: 50, windowMs: 60000, tripDurationMs: 30000 });
  expect(res.status).toBe(201);
  expect(res.body.id).toBe('r1');
  expect(res.body.state).toBe('closed');
});

test('POST /circuit/rules returns 400 for missing fields', async () => {
  const res = await request(buildApp())
    .post('/circuit/rules')
    .send({ id: 'r1' });
  expect(res.status).toBe(400);
});

test('DELETE /circuit/rules/:id removes a rule', async () => {
  const app = buildApp();
  await request(app)
    .post('/circuit/rules')
    .send({ id: 'r1', route: '/api/test', method: 'GET', errorThreshold: 50, windowMs: 60000, tripDurationMs: 30000 });
  const res = await request(app).delete('/circuit/rules/r1');
  expect(res.status).toBe(200);
  expect(res.body.removed).toBe(true);
});

test('DELETE /circuit/rules/:id returns 404 for unknown id', async () => {
  const res = await request(buildApp()).delete('/circuit/rules/unknown');
  expect(res.status).toBe(404);
});

test('DELETE /circuit/rules clears all rules', async () => {
  const app = buildApp();
  await request(app)
    .post('/circuit/rules')
    .send({ id: 'r1', route: '/api/test', method: 'GET', errorThreshold: 50, windowMs: 60000, tripDurationMs: 30000 });
  const res = await request(app).delete('/circuit/rules');
  expect(res.status).toBe(200);
  expect(res.body.cleared).toBe(true);
  const list = await request(app).get('/circuit/rules');
  expect(list.body).toHaveLength(0);
});

test('GET /circuit/status returns statuses for all rules', async () => {
  const app = buildApp();
  await request(app)
    .post('/circuit/rules')
    .send({ id: 'r1', route: '/api/test', method: 'GET', errorThreshold: 50, windowMs: 60000, tripDurationMs: 30000 });
  const res = await request(app).get('/circuit/status');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0]).toHaveProperty('errorRate');
  expect(res.body[0]).toHaveProperty('tripped');
});
