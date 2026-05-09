import express from 'express';
import request from 'supertest';
import { createSessionRouter } from './sessionRouter';
import { recordSession, clearSessions } from './session';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    status: 200,
    duration: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/sessions', createSessionRouter());
  return app;
}

beforeEach(() => clearSessions());

test('GET /sessions returns all session summaries', async () => {
  recordSession('s1', makeRecord());
  recordSession('s2', makeRecord({ status: 500 }));
  const res = await request(buildApp()).get('/sessions');
  expect(res.status).toBe(200);
  expect(res.body.total).toBe(2);
  expect(res.body.sessions).toHaveLength(2);
});

test('GET /sessions/:id returns summary for known session', async () => {
  recordSession('abc', makeRecord({ duration: 80 }));
  const res = await request(buildApp()).get('/sessions/abc');
  expect(res.status).toBe(200);
  expect(res.body.sessionId).toBe('abc');
  expect(res.body.requestCount).toBe(1);
  expect(res.body.totalDuration).toBe(80);
});

test('GET /sessions/:id returns 404 for unknown session', async () => {
  const res = await request(buildApp()).get('/sessions/ghost');
  expect(res.status).toBe(404);
});

test('GET /sessions/:id/records returns raw records', async () => {
  recordSession('r1', makeRecord({ path: '/foo' }));
  const res = await request(buildApp()).get('/sessions/r1/records');
  expect(res.status).toBe(200);
  expect(res.body.count).toBe(1);
  expect(res.body.records[0].path).toBe('/foo');
});

test('DELETE /sessions/:id removes a session', async () => {
  recordSession('del', makeRecord());
  const res = await request(buildApp()).delete('/sessions/del');
  expect(res.status).toBe(200);
  expect(res.body.deleted).toBe(true);
});

test('DELETE /sessions/:id returns 404 for unknown session', async () => {
  const res = await request(buildApp()).delete('/sessions/nope');
  expect(res.status).toBe(404);
});

test('DELETE /sessions clears all sessions', async () => {
  recordSession('x', makeRecord());
  recordSession('y', makeRecord());
  const res = await request(buildApp()).delete('/sessions');
  expect(res.status).toBe(200);
  expect(res.body.cleared).toBe(true);
  const list = await request(buildApp()).get('/sessions');
  expect(list.body.total).toBe(0);
});
