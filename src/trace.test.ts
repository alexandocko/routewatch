import {
  recordTrace,
  getTraceById,
  getAllTraces,
  listTraceIds,
  clearTraces,
  getTraceStats,
} from './trace';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => clearTraces());

describe('recordTrace', () => {
  it('stores a trace entry with the given traceId', () => {
    const record = makeRecord();
    const entry = recordTrace(record, 'trace-001');
    expect(entry.traceId).toBe('trace-001');
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/api/test');
    expect(entry.statusCode).toBe(200);
  });

  it('assigns a unique id per entry', () => {
    const r1 = recordTrace(makeRecord(), 'trace-001');
    const r2 = recordTrace(makeRecord(), 'trace-001');
    expect(r1.id).not.toBe(r2.id);
  });
});

describe('getTraceById', () => {
  it('returns only entries matching the traceId', () => {
    recordTrace(makeRecord({ path: '/a' }), 'trace-aaa');
    recordTrace(makeRecord({ path: '/b' }), 'trace-bbb');
    const results = getTraceById('trace-aaa');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('/a');
  });

  it('returns empty array for unknown traceId', () => {
    expect(getTraceById('nope')).toEqual([]);
  });
});

describe('listTraceIds', () => {
  it('returns unique trace ids', () => {
    recordTrace(makeRecord(), 'id-1');
    recordTrace(makeRecord(), 'id-1');
    recordTrace(makeRecord(), 'id-2');
    const ids = listTraceIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('id-1');
    expect(ids).toContain('id-2');
  });
});

describe('getTraceStats', () => {
  it('computes correct stats for a trace', () => {
    recordTrace(makeRecord({ duration: 100, statusCode: 200 }), 'trace-x');
    recordTrace(makeRecord({ duration: 200, statusCode: 500 }), 'trace-x');
    const stats = getTraceStats('trace-x');
    expect(stats.count).toBe(2);
    expect(stats.totalDuration).toBe(300);
    expect(stats.avgDuration).toBe(150);
    expect(stats.errorCount).toBe(1);
  });

  it('returns zeros for unknown traceId', () => {
    const stats = getTraceStats('unknown');
    expect(stats.count).toBe(0);
    expect(stats.avgDuration).toBe(0);
  });
});

describe('getAllTraces', () => {
  it('returns all recorded entries', () => {
    recordTrace(makeRecord(), 'a');
    recordTrace(makeRecord(), 'b');
    expect(getAllTraces()).toHaveLength(2);
  });
});
