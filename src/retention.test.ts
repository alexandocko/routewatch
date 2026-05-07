import { pruneByCount, pruneByAge, applyRetention, getRetentionStats } from './retention';
import { RouteRecord } from './types';

const NOW = 1_700_000_000_000;

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/test',
    statusCode: 200,
    duration: 10,
    timestamp: NOW,
    ...overrides,
  };
}

describe('pruneByCount', () => {
  it('returns all records when under limit', () => {
    const records = [makeRecord(), makeRecord()];
    expect(pruneByCount(records, 5)).toHaveLength(2);
  });

  it('keeps newest records when over limit', () => {
    const records = [
      makeRecord({ timestamp: NOW - 3000 }),
      makeRecord({ timestamp: NOW - 2000 }),
      makeRecord({ timestamp: NOW - 1000 }),
      makeRecord({ timestamp: NOW }),
    ];
    const result = pruneByCount(records, 2);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(NOW - 1000);
    expect(result[1].timestamp).toBe(NOW);
  });

  it('uses default max of 1000', () => {
    const records = Array.from({ length: 1001 }, () => makeRecord());
    expect(pruneByCount(records)).toHaveLength(1000);
  });
});

describe('pruneByAge', () => {
  it('removes records older than maxAgeMs', () => {
    const records = [
      makeRecord({ timestamp: NOW - 5000 }),
      makeRecord({ timestamp: NOW - 2000 }),
      makeRecord({ timestamp: NOW - 500 }),
    ];
    const result = pruneByAge(records, 3000, NOW);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(NOW - 2000);
  });

  it('keeps all records within age window', () => {
    const records = [makeRecord({ timestamp: NOW - 100 }), makeRecord({ timestamp: NOW })];
    expect(pruneByAge(records, 5000, NOW)).toHaveLength(2);
  });

  it('returns empty array when all records are expired', () => {
    const records = [makeRecord({ timestamp: NOW - 9999 })];
    expect(pruneByAge(records, 1000, NOW)).toHaveLength(0);
  });
});

describe('applyRetention', () => {
  it('applies age then count pruning', () => {
    const records = [
      makeRecord({ timestamp: NOW - 9000 }), // too old
      makeRecord({ timestamp: NOW - 100 }),
      makeRecord({ timestamp: NOW - 50 }),
      makeRecord({ timestamp: NOW }),
    ];
    const result = applyRetention(records, { maxAgeMs: 5000, maxRecords: 2 }, NOW);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(NOW - 50);
  });
});

describe('getRetentionStats', () => {
  it('returns correct stats', () => {
    const records = [
      makeRecord({ timestamp: NOW - 9000 }),
      makeRecord({ timestamp: NOW - 100 }),
      makeRecord({ timestamp: NOW }),
    ];
    const stats = getRetentionStats(records, { maxAgeMs: 5000, maxRecords: 10 }, NOW);
    expect(stats.total).toBe(3);
    expect(stats.retained).toBe(2);
    expect(stats.pruned).toBe(1);
  });
});
