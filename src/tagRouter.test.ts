import express from 'express';
import request from 'supertest';
import { routewatch, clearRecords } from './middleware';
import { createTagRouter } from './tagRouter';
import { TagMap } from './tag';

const tagMap: TagMap = {
  users: '/api/users',
  readonly: '^GET:',
};

function buildApp() {
  const app = express();
  app.use(routewatch());
  app.get('/api/users', (_req, res) => res.json([]));
  app.post('/api/posts', (_req, res) => res.status(201).json({}));
  app.use(createTagRouter(tagMap));
  return app;
}

beforeEach(() => clearRecords());

describe('GET /tags', () => {
  it('returns an empty tag list when no records exist', async () => {
    const app = buildApp();
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('returns tags after requests are recorded', async () => {
    const app = buildApp();
    await request(app).get('/api/users');
    const res = await request(app).get('/tags');
    expect(res.body.tags).toContain('users');
    expect(res.body.tags).toContain('readonly');
  });
});

describe('GET /tags/grouped', () => {
  it('groups records by tag', async () => {
    const app = buildApp();
    await request(app).get('/api/users');
    await request(app).post('/api/posts');
    const res = await request(app).get('/tags/grouped');
    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveProperty('users');
    expect(res.body.groups).toHaveProperty('readonly');
    expect(res.body.groups).toHaveProperty('untagged');
  });

  it('returns an empty groups object when no records exist', async () => {
    const app = buildApp();
    const res = await request(app).get('/tags/grouped');
    expect(res.status).toBe(200);
    expect(res.body.groups).toEqual({});
  });
});

describe('GET /tags/:tag', () => {
  it('returns records for a known tag', async () => {
    const app = buildApp();
    await request(app).get('/api/users');
    const res = await request(app).get('/tags/users');
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe('users');
    expect(res.body.records.length).toBeGreaterThan(0);
  });

  it('returns 404 for an unknown tag', async () => {
    const app = buildApp();
    await request(app).get('/api/users');
    const res = await request(app).get('/tags/nonexistent');
    expect(res.status).toBe(404);
  });
});
