import {
  recordPayload,
  getPayloadEntries,
  clearPayloadEntries,
  computePayloadStats,
} from './payload';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: 'test-id',
    method: 'GET',
    path: '/api/test',
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    requestSize: 128,
    responseSize: 512,
    ...overrides,
  } as RouteRecord;
}

beforeEach(() => {
  clearPayloadEntries();
});

describe('recordPayload', () => {
  it('stores a payload entry from a route record', () => {
    recordPayload(makeRecord());
    const entries = getPayloadEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].requestSize).toBe(128);
    expect(entries[0].responseSize).toBe(512);
  });

  it('defaults to 0 when sizes are missing', () => {
    recordPayload(makeRecord({ requestSize: undefined, responseSize: undefined }));
    const entries = getPayloadEntries();
    expect(entries[0].requestSize).toBe(0);
    expect(entries[0].responseSize).toBe(0);
  });
});

describe('computePayloadStats', () => {
  it('returns empty array when no entries', () => {
    expect(computePayloadStats()).toEqual([]);
  });

  it('aggregates stats per route+method', () => {
    recordPayload(makeRecord({ path: '/api/items', method: 'GET', requestSize: 100, responseSize: 400 }));
    recordPayload(makeRecord({ path: '/api/items', method: 'GET', requestSize: 200, responseSize: 600 }));
    recordPayload(makeRecord({ path: '/api/items', method: 'POST', requestSize: 300, responseSize: 100 }));

    const stats = computePayloadStats();
    expect(stats).toHaveLength(2);

    const getStats = stats.find((s) => s.method === 'GET' && s.route === '/api/items');
    expect(getStats).toBeDefined();
    expect(getStats!.sampleCount).toBe(2);
    expect(getStats!.avgRequestSize).toBe(150);
    expect(getStats!.avgResponseSize).toBe(500);
    expect(getStats!.maxRequestSize).toBe(200);
    expect(getStats!.maxResponseSize).toBe(600);
    expect(getStats!.totalResponseBytes).toBe(1000);
  });

  it('sorts by totalResponseBytes descending', () => {
    recordPayload(makeRecord({ path: '/small', method: 'GET', responseSize: 10 }));
    recordPayload(makeRecord({ path: '/large', method: 'GET', responseSize: 9999 }));

    const stats = computePayloadStats();
    expect(stats[0].route).toBe('/large');
    expect(stats[1].route).toBe('/small');
  });
});

describe('clearPayloadEntries', () => {
  it('removes all stored entries', () => {
    recordPayload(makeRecord());
    clearPayloadEntries();
    expect(getPayloadEntries()).toHaveLength(0);
  });
});
