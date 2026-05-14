import {
  addThrottleRule,
  removeThrottleRule,
  getThrottleRules,
  clearThrottleRules,
  evaluateThrottle,
} from './throttle';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearThrottleRules();
});

describe('addThrottleRule', () => {
  it('adds a rule and returns it with id and createdAt', () => {
    const rule = addThrottleRule({ method: 'GET', path: '/api/items', maxRpm: 100 });
    expect(rule.id).toBeDefined();
    expect(rule.createdAt).toBeDefined();
    expect(getThrottleRules()).toHaveLength(1);
  });
});

describe('removeThrottleRule', () => {
  it('removes an existing rule by id', () => {
    const rule = addThrottleRule({ method: 'GET', path: '/api/items', maxRpm: 100 });
    const removed = removeThrottleRule(rule.id);
    expect(removed).toBe(true);
    expect(getThrottleRules()).toHaveLength(0);
  });

  it('returns false for unknown id', () => {
    expect(removeThrottleRule('nonexistent')).toBe(false);
  });
});

describe('evaluateThrottle', () => {
  it('returns no violations when under limit', () => {
    addThrottleRule({ method: 'GET', path: '/api/items', maxRpm: 1000 });
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ path: '/api/items', timestamp: Date.now() })
    );
    const violations = evaluateThrottle(records);
    expect(violations).toHaveLength(0);
  });

  it('detects violations when rpm exceeds limit', () => {
    addThrottleRule({ method: 'GET', path: '/api/items', maxRpm: 1 });
    const now = Date.now();
    const records = Array.from({ length: 60 }, () =>
      makeRecord({ path: '/api/items', timestamp: now - 1000 })
    );
    const violations = evaluateThrottle(records);
    expect(violations).toHaveLength(1);
    expect(violations[0].path).toBe('/api/items');
    expect(violations[0].currentRpm).toBeGreaterThan(1);
  });

  it('ignores records outside the time window', () => {
    addThrottleRule({ method: 'GET', path: '/api/items', maxRpm: 1 });
    const old = Date.now() - 120_000;
    const records = Array.from({ length: 60 }, () =>
      makeRecord({ path: '/api/items', timestamp: old })
    );
    const violations = evaluateThrottle(records);
    expect(violations).toHaveLength(0);
  });

  it('only matches method and path together', () => {
    addThrottleRule({ method: 'POST', path: '/api/items', maxRpm: 1 });
    const records = Array.from({ length: 60 }, () =>
      makeRecord({ method: 'GET', path: '/api/items', timestamp: Date.now() })
    );
    const violations = evaluateThrottle(records);
    expect(violations).toHaveLength(0);
  });
});
