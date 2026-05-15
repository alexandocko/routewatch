import {
  addThrottleRule,
  removeThrottleRule,
  getThrottleRules,
  clearThrottleRules,
  evaluateThrottle,
} from "./throttle";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/data",
    status: 200,
    duration: 15,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearThrottleRules();
});

describe("addThrottleRule", () => {
  it("adds a rule and assigns an id", () => {
    const rule = addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 60 });
    expect(rule.id).toBeDefined();
    expect(getThrottleRules()).toHaveLength(1);
  });

  it("uses default windowMs of 60000", () => {
    const rule = addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 10 });
    expect(rule.windowMs).toBe(60000);
  });

  it("respects custom windowMs", () => {
    const rule = addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 10, windowMs: 30000 });
    expect(rule.windowMs).toBe(30000);
  });
});

describe("removeThrottleRule", () => {
  it("removes an existing rule by id", () => {
    const rule = addThrottleRule({ route: "/a", method: "POST", maxRpm: 5 });
    expect(removeThrottleRule(rule.id)).toBe(true);
    expect(getThrottleRules()).toHaveLength(0);
  });

  it("returns false for unknown id", () => {
    expect(removeThrottleRule("ghost")).toBe(false);
  });
});

describe("evaluateThrottle", () => {
  it("returns no violations when no rules exist", () => {
    const results = evaluateThrottle([makeRecord()]);
    expect(results).toHaveLength(0);
  });

  it("detects exceeded routes", () => {
    addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 1, windowMs: 60000 });
    const now = Date.now();
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ path: "/api/data", method: "GET", timestamp: now })
    );
    const results = evaluateThrottle(records);
    expect(results).toHaveLength(1);
    expect(results[0].exceeded).toBe(true);
    expect(results[0].currentRpm).toBe(5);
  });

  it("does not flag routes within limit", () => {
    addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 100, windowMs: 60000 });
    const records = [makeRecord({ path: "/api/data", method: "GET" })];
    const results = evaluateThrottle(records);
    expect(results[0].exceeded).toBe(false);
  });

  it("ignores records outside the time window", () => {
    addThrottleRule({ route: "/api/data", method: "GET", maxRpm: 1, windowMs: 10000 });
    const old = Date.now() - 20000;
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ path: "/api/data", method: "GET", timestamp: old })
    );
    const results = evaluateThrottle(records);
    expect(results[0].exceeded).toBe(false);
  });
});
