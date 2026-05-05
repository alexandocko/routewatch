import { filterRecords, FilterOptions } from './filter';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    duration: 50,
    timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('filterRecords', () => {
  const records: RouteRecord[] = [
    makeRecord({ method: 'GET', path: '/api/users', statusCode: 200, duration: 30 }),
    makeRecord({ method: 'POST', path: '/api/users', statusCode: 201, duration: 80 }),
    makeRecord({ method: 'GET', path: '/api/items', statusCode: 404, duration: 10 }),
    makeRecord({ method: 'DELETE', path: '/api/users/1', statusCode: 500, duration: 200 }),
    makeRecord({ method: 'GET', path: '/health', statusCode: 200, duration: 5, timestamp: new Date('2024-01-16T12:00:00Z').toISOString() }),
  ];

  it('returns all records when no options given', () => {
    expect(filterRecords(records, {})).toHaveLength(5);
  });

  it('filters by single method', () => {
    const result = filterRecords(records, { method: 'GET' });
    expect(result).toHaveLength(3);
    result.forEach((r) => expect(r.method).toBe('GET'));
  });

  it('filters by multiple methods', () => {
    const result = filterRecords(records, { method: ['GET', 'POST'] });
    expect(result).toHaveLength(4);
  });

  it('filters by string path substring', () => {
    const result = filterRecords(records, { path: '/api/users' });
    expect(result).toHaveLength(3);
  });

  it('filters by regex path', () => {
    const result = filterRecords(records, { path: /\/api\/users\/\d+/ });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/api/users/1');
  });

  it('filters by single status code', () => {
    const result = filterRecords(records, { statusCode: 200 });
    expect(result).toHaveLength(2);
  });

  it('filters by multiple status codes', () => {
    const result = filterRecords(records, { statusCode: [200, 201] });
    expect(result).toHaveLength(3);
  });

  it('filters by minDuration', () => {
    const result = filterRecords(records, { minDuration: 50 });
    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.duration).toBeGreaterThanOrEqual(50));
  });

  it('filters by maxDuration', () => {
    const result = filterRecords(records, { maxDuration: 30 });
    expect(result).toHaveLength(2);
  });

  it('filters by since date', () => {
    const result = filterRecords(records, { since: new Date('2024-01-16T00:00:00Z') });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/health');
  });

  it('filters by until date', () => {
    const result = filterRecords(records, { until: new Date('2024-01-15T23:59:59Z') });
    expect(result).toHaveLength(4);
  });

  it('combines multiple filters', () => {
    const result = filterRecords(records, { method: 'GET', statusCode: 200 });
    expect(result).toHaveLength(2);
  });
});
