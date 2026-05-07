import express from 'express';
import request from 'supertest';
import { clearBookmarks, addBookmark } from './bookmark';
import { createBookmarkRouter } from './bookmarkRouter';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/bookmarks', createBookmarkRouter());
  return app;
}

beforeEach(() => {
  clearBookmarks();
});

describe('GET /bookmarks', () => {
  it('returns empty array when no bookmarks', async () => {
    const res = await request(buildApp()).get('/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all bookmarks', async () => {
    addBookmark({ route: '/api/test', method: 'GET' }, 'Test');
    const res = await request(buildApp()).get('/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].label).toBe('Test');
  });

  it('filters by route and method query params', async () => {
    addBookmark({ route: '/api/a', method: 'GET' }, 'A');
    addBookmark({ route: '/api/b', method: 'POST' }, 'B');
    const res = await request(buildApp()).get('/bookmarks?route=/api/a&method=GET');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].route).toBe('/api/a');
  });
});

describe('POST /bookmarks', () => {
  it('creates a bookmark and returns 201', async () => {
    const res = await request(buildApp())
      .post('/bookmarks')
      .send({ route: '/api/users', method: 'GET', label: 'Users list', notes: 'Check perf' });
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^bm_/);
    expect(res.body.notes).toBe('Check perf');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(buildApp()).post('/bookmarks').send({ route: '/api/x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /bookmarks/:id', () => {
  it('returns the bookmark by id', async () => {
    const bm = addBookmark({ route: '/x', method: 'DELETE' }, 'X');
    const res = await request(buildApp()).get(`/bookmarks/${bm.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(bm.id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(buildApp()).get('/bookmarks/unknown');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /bookmarks/:id', () => {
  it('removes a bookmark and returns 204', async () => {
    const bm = addBookmark({ route: '/del', method: 'GET' }, 'Del');
    const res = await request(buildApp()).delete(`/bookmarks/${bm.id}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when bookmark does not exist', async () => {
    const res = await request(buildApp()).delete('/bookmarks/ghost');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /bookmarks', () => {
  it('clears all bookmarks', async () => {
    addBookmark({ route: '/a', method: 'GET' }, 'A');
    addBookmark({ route: '/b', method: 'GET' }, 'B');
    const res = await request(buildApp()).delete('/bookmarks');
    expect(res.status).toBe(204);
    const list = await request(buildApp()).get('/bookmarks');
    expect(list.body).toEqual([]);
  });
});
