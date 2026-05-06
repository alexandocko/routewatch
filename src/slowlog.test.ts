import { recordSlowlog, getSlowlogEntries, clearSlowlog, getSlowlogStats } from './slowlog';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    duration: 100,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

describe('slowlog', () => {
  beforeEach(() => clearSlowlog());

  describe('recordSlowlog', () => {
    it('ignores records below threshold', () => {
      const result = recordSlowlog(makeRecord({ duration: 200 }), { threshold: 500 });
      expect(result).toBeNull();
      expect(getSlowlogEntries()).toHaveLength(0);
    });

    it('records entries at or above threshold', () => {
      const result = recordSlowlog(makeRecord({ duration: 600 }), { threshold: 500 });
      expect(result).not.toBeNull();
      expect(result?.duration).toBe(600);
      expect(getSlowlogEntries()).toHaveLength(1);
    });

    it('uses default threshold of 500ms', () => {
      recordSlowlog(makeRecord({ duration: 499 }));
      expect(getSlowlogEntries()).toHaveLength(0);
      recordSlowlog(makeRecord({ duration: 500 }));
      expect(getSlowlogEntries()).toHaveLength(1);
    });

    it('respects the limit option', () => {
      for (let i = 0; i < 5; i++) {
        recordSlowlog(makeRecord({ duration: 1000 }), { limit: 3 });
      }
      expect(getSlowlogEntries()).toHaveLength(3);
    });

    it('stores all relevant fields', () => {
      const record = makeRecord({ method: 'POST', path: '/api/slow', duration: 800, statusCode: 201 });
      const entry = recordSlowlog(record, { threshold: 500 });
      expect(entry?.method).toBe('POST');
      expect(entry?.path).toBe('/api/slow');
      expect(entry?.statusCode).toBe(201);
    });
  });

  describe('getSlowlogStats', () => {
    it('returns zeros for empty entries', () => {
      const stats = getSlowlogStats([]);
      expect(stats.count).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.topRoutes).toHaveLength(0);
    });

    it('computes stats from provided entries', () => {
      recordSlowlog(makeRecord({ duration: 600 }));
      recordSlowlog(makeRecord({ duration: 1000, path: '/api/other' }));
      const stats = getSlowlogStats(getSlowlogEntries());
      expect(stats.count).toBe(2);
      expect(stats.avgDuration).toBe(800);
      expect(stats.maxDuration).toBe(1000);
    });

    it('returns top routes sorted by avgDuration', () => {
      recordSlowlog(makeRecord({ duration: 600, path: '/fast' }));
      recordSlowlog(makeRecord({ duration: 1200, path: '/slow' }));
      const stats = getSlowlogStats(getSlowlogEntries());
      expect(stats.topRoutes[0].route).toContain('/slow');
    });
  });
});
