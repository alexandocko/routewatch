import {
  recordSession,
  getSession,
  listSessions,
  deleteSession,
  clearSessions,
  summarizeSession,
} from './session';
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

beforeEach(() => clearSessions());

test('recordSession stores records under sessionId', () => {
  recordSession('abc', makeRecord());
  recordSession('abc', makeRecord({ path: '/other' }));
  expect(getSession('abc')).toHaveLength(2);
});

test('getSession returns empty array for unknown session', () => {
  expect(getSession('unknown')).toEqual([]);
});

test('listSessions returns all session ids', () => {
  recordSession('s1', makeRecord());
  recordSession('s2', makeRecord());
  const ids = listSessions();
  expect(ids).toContain('s1');
  expect(ids).toContain('s2');
});

test('deleteSession removes session', () => {
  recordSession('del', makeRecord());
  expect(deleteSession('del')).toBe(true);
  expect(getSession('del')).toEqual([]);
});

test('deleteSession returns false for missing session', () => {
  expect(deleteSession('nope')).toBe(false);
});

test('summarizeSession returns null for unknown session', () => {
  expect(summarizeSession('ghost')).toBeNull();
});

test('summarizeSession computes correct stats', () => {
  const now = Date.now();
  recordSession('s', makeRecord({ duration: 100, status: 200, timestamp: now - 1000, path: '/a' }));
  recordSession('s', makeRecord({ duration: 200, status: 500, timestamp: now, path: '/b' }));

  const summary = summarizeSession('s')!;
  expect(summary.requestCount).toBe(2);
  expect(summary.totalDuration).toBe(300);
  expect(summary.avgDuration).toBe(150);
  expect(summary.errorCount).toBe(1);
  expect(summary.routes).toContain('GET /a');
  expect(summary.routes).toContain('GET /b');
  expect(summary.firstSeen).toBe(now - 1000);
  expect(summary.lastSeen).toBe(now);
});

test('clearSessions wipes all data', () => {
  recordSession('x', makeRecord());
  clearSessions();
  expect(listSessions()).toHaveLength(0);
});
