import { toJson, toCsv, contentTypeFor, exportRecords } from './export';
import { RouteRecord } from './types';

const sampleRecords: RouteRecord[] = [
  {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    duration: 12,
    timestamp: 1700000000000,
  },
  {
    method: 'POST',
    path: '/api/users',
    statusCode: 201,
    duration: 34,
    timestamp: 1700000001000,
  },
];

describe('toJson', () => {
  it('produces valid JSON', () => {
    const result = toJson(sampleRecords);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('contains all records', () => {
    const parsed = JSON.parse(toJson(sampleRecords));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].path).toBe('/api/users');
  });

  it('returns empty array JSON for no records', () => {
    expect(toJson([])).toBe('[]');
  });
});

describe('toCsv', () => {
  it('includes a header row', () => {
    const result = toCsv(sampleRecords);
    expect(result.startsWith('method,path,statusCode,duration,timestamp')).toBe(true);
  });

  it('contains one row per record', () => {
    const lines = toCsv(sampleRecords).split('\n');
    // header + 2 data rows
    expect(lines).toHaveLength(3);
  });

  it('formats timestamps as ISO strings', () => {
    const result = toCsv(sampleRecords);
    expect(result).toContain(new Date(1700000000000).toISOString());
  });

  it('returns only header for empty records', () => {
    const result = toCsv([]);
    expect(result).toBe('method,path,statusCode,duration,timestamp');
  });
});

describe('contentTypeFor', () => {
  it('returns text/csv for csv', () => {
    expect(contentTypeFor('csv')).toBe('text/csv');
  });

  it('returns application/json for json', () => {
    expect(contentTypeFor('json')).toBe('application/json');
  });
});

describe('exportRecords', () => {
  it('delegates to toCsv when format is csv', () => {
    const result = exportRecords(sampleRecords, 'csv');
    expect(result).toContain('method,path');
  });

  it('delegates to toJson when format is json', () => {
    const result = exportRecords(sampleRecords, 'json');
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
