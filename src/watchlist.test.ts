import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getWatchlistEntry,
  clearWatchlist,
  tickWatchlist,
} from './watchlist';
import { RouteRecord } from './types';

function makeRecord(method: string, path: string): RouteRecord {
  return {
    method,
    path,
    statusCode: 200,
    duration: 10,
    timestamp: Date.now(),
  };
}

beforeEach(() => clearWatchlist());

describe('addToWatchlist', () => {
  it('adds a new entry', () => {
    const entry = addToWatchlist('GET', '/api/users');
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/api/users');
    expect(entry.hitCount).toBe(0);
  });

  it('normalises method to uppercase', () => {
    const entry = addToWatchlist('get', '/ping');
    expect(entry.method).toBe('GET');
  });

  it('returns existing entry on duplicate add', () => {
    addToWatchlist('POST', '/items', 'items-create');
    const second = addToWatchlist('POST', '/items');
    expect(second.label).toBe('items-create');
    expect(getWatchlist()).toHaveLength(1);
  });
});

describe('removeFromWatchlist', () => {
  it('removes an existing entry', () => {
    addToWatchlist('DELETE', '/items/1');
    expect(removeFromWatchlist('DELETE', '/items/1')).toBe(true);
    expect(getWatchlist()).toHaveLength(0);
  });

  it('returns false for unknown entry', () => {
    expect(removeFromWatchlist('GET', '/nope')).toBe(false);
  });
});

describe('getWatchlistEntry', () => {
  it('returns the entry when present', () => {
    addToWatchlist('GET', '/health');
    const entry = getWatchlistEntry('GET', '/health');
    expect(entry).toBeDefined();
    expect(entry!.path).toBe('/health');
  });

  it('returns undefined when absent', () => {
    expect(getWatchlistEntry('GET', '/missing')).toBeUndefined();
  });
});

describe('tickWatchlist', () => {
  it('increments hitCount for watched routes', () => {
    addToWatchlist('GET', '/api/data');
    tickWatchlist(makeRecord('GET', '/api/data'));
    tickWatchlist(makeRecord('GET', '/api/data'));
    const entry = getWatchlistEntry('GET', '/api/data');
    expect(entry!.hitCount).toBe(2);
  });

  it('ignores records for unwatched routes', () => {
    tickWatchlist(makeRecord('GET', '/not-watched'));
    expect(getWatchlist()).toHaveLength(0);
  });

  it('updates lastSeenAt', () => {
    addToWatchlist('POST', '/submit');
    const rec = makeRecord('POST', '/submit');
    tickWatchlist(rec);
    expect(getWatchlistEntry('POST', '/submit')!.lastSeenAt).toBe(rec.timestamp);
  });
});
