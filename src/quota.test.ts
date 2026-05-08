import {
  addQuotaRule,
  clearQuotaRules,
  evaluateQuotas,
  getQuotaRules,
  removeQuotaRule,
} from "./quota";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: "test-id",
    method: "GET",
    path: "/api/test",
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearQuotaRules();
});

describe("quota rules management", () => {
  it("adds and retrieves a quota rule", () => {
    addQuotaRule({ route: "/api/items", maxRequests: 100, windowMs: 60000 });
    const rules = getQuotaRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].route).toBe("/api/items");
  });

  it("removes a quota rule by route", () => {
    addQuotaRule({ route: "/api/items", maxRequests: 100, windowMs: 60000 });
    removeQuotaRule("/api/items");
    expect(getQuotaRules()).toHaveLength(0);
  });

  it("clears all rules", () => {
    addQuotaRule({ route: "/a", maxRequests: 10, windowMs: 1000 });
    addQuotaRule({ route: "/b", maxRequests: 20, windowMs: 1000 });
    clearQuotaRules();
    expect(getQuotaRules()).toHaveLength(0);
  });
});

describe("evaluateQuotas", () => {
  const now = Date.now();

  it("returns not exceeded when count is within limit", () => {
    addQuotaRule({ route: "/api/test", maxRequests: 5, windowMs: 60000 });
    const records = [makeRecord({ timestamp: now - 1000 })];
    const [status] = evaluateQuotas(records, now);
    expect(status.count).toBe(1);
    expect(status.exceeded).toBe(false);
  });

  it("marks exceeded when count surpasses limit", () => {
    addQuotaRule({ route: "/api/test", maxRequests: 2, windowMs: 60000 });
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ timestamp: now - 1000 })
    );
    const [status] = evaluateQuotas(records, now);
    expect(status.count).toBe(5);
    expect(status.exceeded).toBe(true);
  });

  it("ignores records outside the time window", () => {
    addQuotaRule({ route: "/api/test", maxRequests: 10, windowMs: 5000 });
    const records = [
      makeRecord({ timestamp: now - 10000 }),
      makeRecord({ timestamp: now - 1000 }),
    ];
    const [status] = evaluateQuotas(records, now);
    expect(status.count).toBe(1);
  });

  it("filters by method when specified", () => {
    addQuotaRule({
      route: "/api/test",
      method: "POST",
      maxRequests: 1,
      windowMs: 60000,
    });
    const records = [
      makeRecord({ method: "GET", timestamp: now - 100 }),
      makeRecord({ method: "POST", timestamp: now - 100 }),
      makeRecord({ method: "POST", timestamp: now - 200 }),
    ];
    const [status] = evaluateQuotas(records, now);
    expect(status.count).toBe(2);
    expect(status.exceeded).toBe(true);
  });
});
