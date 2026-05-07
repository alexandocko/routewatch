import express, { Express } from 'express';
import request from 'supertest';
import { createSnapshotRouter } from './snapshotRouter';
import { clearSnapshots, createSnapshot } from './snapshot';
import { clearRecords } from './middleware';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    duration: 30,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/snapshots', createSnapshotRouter());
  return app;
}

beforeEach(() => {
  clearSnapshots();
  clearRecords();
});

describe('GET /snapshots', () => {
  it('returns empty list initially', async () => {
    const res = await request(buildApp()).get('/snapshots');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.snapshots).toEqual([]);
  });

  it('lists created snapshots without full records', async () => {
    createSnapshot([makeRecord()], 'test snap');
    const res = await request(buildApp()).get('/snapshots');
    expect(res.body.count).toBe(1);
    expect(res.body.snapshots[0].label).toBe('test snap');
    expect(res.body.snapshots[0].recordCount).toBe(1);
    expect(res.body.snapshots[0].records).toBeUndefined();
  });
});

describe('POST /snapshots', () => {
  it('returns 400 when no records exist', async () => {
    const res = await request(buildApp()).post('/snapshots').send({ label: 'empty' });
    expect(res.status).toBe(400);
  });
});

describe('GET /snapshots/:id', () => {
  it('returns full snapshot by id', async () => {
    const snap = createSnapshot([makeRecord()], 'detail test');
    const res = await request(buildApp()).get(`/snapshots/${snap.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(snap.id);
    expect(res.body.records).toHaveLength(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(buildApp()).get('/snapshots/unknown_id');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /snapshots/:id', () => {
  it('deletes an existing snapshot', async () => {
    const snap = createSnapshot([makeRecord()]);
    const res = await request(buildApp()).delete(`/snapshots/${snap.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(buildApp()).delete('/snapshots/ghost');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /snapshots', () => {
  it('clears all snapshots', async () => {
    createSnapshot([makeRecord()]);
    createSnapshot([makeRecord()]);
    const res = await request(buildApp()).delete('/snapshots');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const list = await request(buildApp()).get('/snapshots');
    expect(list.body.count).toBe(0);
  });
});
