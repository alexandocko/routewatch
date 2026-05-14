import {
  addCircuitRule,
  clearCircuitRules,
  evaluateCircuits,
  getCircuitRules,
  removeCircuitRule,
} from './circuit';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: 'r1',
    method: 'GET',
    path: '/api/data',
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => clearCircuitRules());

test('addCircuitRule stores rule with closed state', () => {
  const rule = addCircuitRule({
    id: 'r1',
    route: '/api/data',
    method: 'GET',
    errorThreshold: 50,
    windowMs: 60_000,
    tripDurationMs: 30_000,
  });
  expect(rule.state).toBe('closed');
  expect(getCircuitRules()).toHaveLength(1);
});

test('removeCircuitRule deletes rule', () => {
  addCircuitRule({ id: 'r1', route: '/api/data', method: 'GET', errorThreshold: 50, windowMs: 60_000, tripDurationMs: 30_000 });
  removeCircuitRule('r1');
  expect(getCircuitRules()).toHaveLength(0);
});

test('circuit stays closed when error rate is below threshold', () => {
  addCircuitRule({ id: 'r1', route: '/api/data', method: 'GET', errorThreshold: 50, windowMs: 60_000, tripDurationMs: 30_000 });
  const records = [
    makeRecord({ status: 200 }),
    makeRecord({ status: 200 }),
    makeRecord({ status: 500 }),
  ];
  const [status] = evaluateCircuits(records);
  expect(status.rule.state).toBe('closed');
  expect(status.tripped).toBe(false);
});

test('circuit opens when error rate exceeds threshold', () => {
  addCircuitRule({ id: 'r1', route: '/api/data', method: 'GET', errorThreshold: 50, windowMs: 60_000, tripDurationMs: 30_000 });
  const records = [
    makeRecord({ status: 500 }),
    makeRecord({ status: 500 }),
    makeRecord({ status: 200 }),
  ];
  const [status] = evaluateCircuits(records);
  expect(status.rule.state).toBe('open');
  expect(status.tripped).toBe(true);
});

test('circuit ignores records outside time window', () => {
  addCircuitRule({ id: 'r1', route: '/api/data', method: 'GET', errorThreshold: 50, windowMs: 1_000, tripDurationMs: 30_000 });
  const old = makeRecord({ status: 500, timestamp: Date.now() - 5_000 });
  const [status] = evaluateCircuits([old]);
  expect(status.rule.state).toBe('closed');
  expect(status.errorRate).toBe(0);
});

test('circuit transitions to half-open after trip duration', () => {
  addCircuitRule({ id: 'r1', route: '/api/data', method: 'GET', errorThreshold: 50, windowMs: 60_000, tripDurationMs: 0 });
  // Force open
  const records = [makeRecord({ status: 500 }), makeRecord({ status: 500 })];
  evaluateCircuits(records);
  // Now evaluate again with no errors — should go half-open then closed
  const [status] = evaluateCircuits([makeRecord({ status: 200 })]);
  expect(status.rule.state).toBe('closed');
});
