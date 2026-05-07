import {
  createSnapshot,
  getSnapshot,
  listSnapshots,
  deleteSnapshot,
  clearSnapshots,
  getSnapshotCount,
} from './snapshot';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/test',
    statusCode: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearSnapshots();
});

describe('createSnapshot', () => {
  it('creates a snapshot with a unique id', () => {
    const snap = createSnapshot([makeRecord()]);
    expect(snap.id).toMatch(/^snap_/);
    expect(snap.records).toHaveLength(1);
  });

  it('uses provided label', () => {
    const snap = createSnapshot([], 'My Label');
    expect(snap.label).toBe('My Label');
  });

  it('assigns default label when none provided', () => {
    const snap = createSnapshot([]);
    expect(snap.label).toMatch(/Snapshot/);
  });

  it('deep copies records so mutations do not affect snapshot', () => {
    const record = makeRecord({ path: '/original' });
    const snap = createSnapshot([record]);
    record.path = '/mutated';
    expect(snap.records[0].path).toBe('/original');
  });
});

describe('getSnapshot', () => {
  it('returns the snapshot by id', () => {
    const snap = createSnapshot([makeRecord()]);
    expect(getSnapshot(snap.id)).toEqual(snap);
  });

  it('returns undefined for unknown id', () => {
    expect(getSnapshot('nonexistent')).toBeUndefined();
  });
});

describe('listSnapshots', () => {
  it('returns snapshots newest first', async () => {
    const s1 = createSnapshot([], 'first');
    await new Promise(r => setTimeout(r, 5));
    const s2 = createSnapshot([], 'second');
    const list = listSnapshots();
    expect(list[0].id).toBe(s2.id);
    expect(list[1].id).toBe(s1.id);
  });
});

describe('deleteSnapshot', () => {
  it('removes a snapshot and returns true', () => {
    const snap = createSnapshot([]);
    expect(deleteSnapshot(snap.id)).toBe(true);
    expect(getSnapshot(snap.id)).toBeUndefined();
  });

  it('returns false for unknown id', () => {
    expect(deleteSnapshot('ghost')).toBe(false);
  });
});

describe('getSnapshotCount', () => {
  it('reflects current count', () => {
    expect(getSnapshotCount()).toBe(0);
    createSnapshot([]);
    createSnapshot([]);
    expect(getSnapshotCount()).toBe(2);
  });
});
