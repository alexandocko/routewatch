import {
  recordBreadcrumb,
  getBreadcrumbBySession,
  listBreadcrumbs,
  deleteBreadcrumb,
  clearBreadcrumbs,
} from './breadcrumb';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    duration: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearBreadcrumbs();
});

describe('recordBreadcrumb', () => {
  it('creates a new breadcrumb for a new session', () => {
    recordBreadcrumb('sess-1', makeRecord());
    const result = getBreadcrumbBySession('sess-1');
    expect(result).toBeDefined();
    expect(result!.sessionId).toBe('sess-1');
    expect(result!.steps).toHaveLength(1);
  });

  it('appends steps for an existing session', () => {
    recordBreadcrumb('sess-1', makeRecord({ path: '/a' }));
    recordBreadcrumb('sess-1', makeRecord({ path: '/b' }));
    const result = getBreadcrumbBySession('sess-1');
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0].path).toBe('/a');
    expect(result!.steps[1].path).toBe('/b');
  });

  it('keeps separate breadcrumbs for different sessions', () => {
    recordBreadcrumb('sess-1', makeRecord({ path: '/x' }));
    recordBreadcrumb('sess-2', makeRecord({ path: '/y' }));
    expect(listBreadcrumbs()).toHaveLength(2);
  });
});

describe('getBreadcrumbBySession', () => {
  it('returns undefined for unknown session', () => {
    expect(getBreadcrumbBySession('unknown')).toBeUndefined();
  });

  it('returns the correct breadcrumb', () => {
    recordBreadcrumb('sess-abc', makeRecord({ statusCode: 404 }));
    const result = getBreadcrumbBySession('sess-abc');
    expect(result!.steps[0].statusCode).toBe(404);
  });
});

describe('deleteBreadcrumb', () => {
  it('removes a breadcrumb by sessionId', () => {
    recordBreadcrumb('sess-del', makeRecord());
    const removed = deleteBreadcrumb('sess-del');
    expect(removed).toBe(true);
    expect(getBreadcrumbBySession('sess-del')).toBeUndefined();
  });

  it('returns false when session does not exist', () => {
    expect(deleteBreadcrumb('nonexistent')).toBe(false);
  });
});

describe('clearBreadcrumbs', () => {
  it('removes all breadcrumbs', () => {
    recordBreadcrumb('s1', makeRecord());
    recordBreadcrumb('s2', makeRecord());
    clearBreadcrumbs();
    expect(listBreadcrumbs()).toHaveLength(0);
  });
});
