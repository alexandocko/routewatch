import { computeDependencies } from './dependency';
import { RouteRecord } from './types';

function makeRecord(path: string, duration: number, referer?: string): RouteRecord {
  return {
    id: Math.random().toString(36).slice(2),
    method: 'GET',
    path,
    status: 200,
    duration,
    timestamp: Date.now(),
    referer,
  } as RouteRecord & { referer?: string };
}

describe('computeDependencies', () => {
  it('returns empty graph when no records', () => {
    const result = computeDependencies([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('collects nodes from paths with no referer', () => {
    const records = [makeRecord('/api/users', 50), makeRecord('/api/posts', 80)];
    const result = computeDependencies(records);
    expect(result.nodes).toContain('/api/users');
    expect(result.nodes).toContain('/api/posts');
    expect(result.edges).toHaveLength(0);
  });

  it('creates an edge from referer to path', () => {
    const records = [
      makeRecord('/api/posts', 60, 'http://localhost:3000/api/users'),
    ];
    const result = computeDependencies(records);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].from).toBe('/api/users');
    expect(result.edges[0].to).toBe('/api/posts');
    expect(result.edges[0].count).toBe(1);
  });

  it('accumulates counts and averages latency for repeated edges', () => {
    const records = [
      makeRecord('/api/posts', 100, 'http://localhost/api/users'),
      makeRecord('/api/posts', 200, 'http://localhost/api/users'),
    ];
    const result = computeDependencies(records);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].count).toBe(2);
    expect(result.edges[0].avgLatency).toBe(150);
  });

  it('ignores self-referencing edges', () => {
    const records = [makeRecord('/api/users', 50, 'http://localhost/api/users')];
    const result = computeDependencies(records);
    expect(result.edges).toHaveLength(0);
  });

  it('handles plain pathname referers without a host', () => {
    const records = [makeRecord('/api/comments', 70, '/api/posts')];
    const result = computeDependencies(records);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].from).toBe('/api/posts');
    expect(result.edges[0].to).toBe('/api/comments');
  });

  it('sorts edges by count descending', () => {
    const records = [
      makeRecord('/api/c', 10, '/api/a'),
      makeRecord('/api/b', 10, '/api/a'),
      makeRecord('/api/b', 10, '/api/a'),
    ];
    const result = computeDependencies(records);
    expect(result.edges[0].to).toBe('/api/b');
    expect(result.edges[0].count).toBe(2);
  });
});
