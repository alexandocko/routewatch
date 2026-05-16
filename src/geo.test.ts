import {
  recordGeo,
  getGeoEntries,
  clearGeoEntries,
  computeGeoStats,
} from './geo';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/test',
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearGeoEntries();
});

describe('recordGeo', () => {
  it('stores a new geo entry', () => {
    recordGeo('1.2.3.4', 'US', 'California', 'San Francisco');
    const entries = getGeoEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].ip).toBe('1.2.3.4');
    expect(entries[0].country).toBe('US');
    expect(entries[0].count).toBe(1);
  });

  it('increments count for existing ip', () => {
    recordGeo('1.2.3.4', 'US', 'California', 'San Francisco');
    recordGeo('1.2.3.4', 'US', 'California', 'San Francisco');
    const entries = getGeoEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].count).toBe(2);
  });

  it('stores separate entries for different ips', () => {
    recordGeo('1.2.3.4', 'US', 'California', 'Los Angeles');
    recordGeo('5.6.7.8', 'DE', 'Berlin', 'Berlin');
    expect(getGeoEntries()).toHaveLength(2);
  });
});

describe('clearGeoEntries', () => {
  it('removes all entries', () => {
    recordGeo('1.2.3.4', 'US', 'California', 'San Francisco');
    clearGeoEntries();
    expect(getGeoEntries()).toHaveLength(0);
  });
});

describe('computeGeoStats', () => {
  it('returns zero stats when empty', () => {
    const stats = computeGeoStats([]);
    expect(stats.totalUnique).toBe(0);
    expect(stats.entries).toHaveLength(0);
    expect(stats.topIps).toHaveLength(0);
  });

  it('aggregates counts by country', () => {
    recordGeo('1.1.1.1', 'US', 'CA', 'LA');
    recordGeo('2.2.2.2', 'US', 'NY', 'New York');
    recordGeo('3.3.3.3', 'FR', 'IDF', 'Paris');
    const stats = computeGeoStats([makeRecord()]);
    expect(stats.byCountry['US']).toBe(2);
    expect(stats.byCountry['FR']).toBe(1);
  });

  it('returns top ips sorted by count', () => {
    recordGeo('10.0.0.1', 'US', 'TX', 'Austin');
    recordGeo('10.0.0.1', 'US', 'TX', 'Austin');
    recordGeo('10.0.0.1', 'US', 'TX', 'Austin');
    recordGeo('10.0.0.2', 'US', 'TX', 'Austin');
    const stats = computeGeoStats([]);
    expect(stats.topIps[0].ip).toBe('10.0.0.1');
    expect(stats.topIps[0].count).toBe(3);
    expect(stats.topIps[1].ip).toBe('10.0.0.2');
  });

  it('reports totalUnique correctly', () => {
    recordGeo('a.b.c.d', 'JP', 'Tokyo', 'Tokyo');
    recordGeo('e.f.g.h', 'KR', 'Seoul', 'Seoul');
    const stats = computeGeoStats([]);
    expect(stats.totalUnique).toBe(2);
  });
});
