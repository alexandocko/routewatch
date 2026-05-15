import {
  recordCacheEvent,
  getCacheEvents,
  clearCacheEvents,
  computeCacheStats,
  getCacheStatsByRoute,
} from "./cache";

beforeEach(() => {
  clearCacheEvents();
});

describe("recordCacheEvent", () => {
  it("records a cache hit", () => {
    recordCacheEvent("/api/users", "GET", true, 5);
    const events = getCacheEvents();
    expect(events).toHaveLength(1);
    expect(events[0].hit).toBe(true);
    expect(events[0].latencyMs).toBe(5);
  });

  it("records a cache miss", () => {
    recordCacheEvent("/api/items", "GET", false);
    const events = getCacheEvents();
    expect(events[0].hit).toBe(false);
    expect(events[0].latencyMs).toBeUndefined();
  });

  it("normalizes method to uppercase", () => {
    recordCacheEvent("/api/data", "get", true);
    expect(getCacheEvents()[0].method).toBe("GET");
  });
});

describe("getCacheEvents", () => {
  it("returns a copy of the events array", () => {
    recordCacheEvent("/api/a", "GET", true);
    const events = getCacheEvents();
    events.push({ route: "/fake", method: "GET", hit: true, timestamp: 0 });
    expect(getCacheEvents()).toHaveLength(1);
  });
});

describe("clearCacheEvents", () => {
  it("clears all recorded events", () => {
    recordCacheEvent("/api/x", "GET", true);
    clearCacheEvents();
    expect(getCacheEvents()).toHaveLength(0);
  });
});

describe("computeCacheStats", () => {
  it("aggregates hits and misses per route", () => {
    recordCacheEvent("/api/users", "GET", true);
    recordCacheEvent("/api/users", "GET", true);
    recordCacheEvent("/api/users", "GET", false);
    const stats = computeCacheStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].hitCount).toBe(2);
    expect(stats[0].missCount).toBe(1);
  });

  it("computes hit rate correctly", () => {
    recordCacheEvent("/api/posts", "GET", true);
    recordCacheEvent("/api/posts", "GET", false);
    recordCacheEvent("/api/posts", "GET", false);
    const stats = computeCacheStats();
    expect(stats[0].hitRate).toBeCloseTo(1 / 3);
  });

  it("tracks multiple routes separately", () => {
    recordCacheEvent("/api/a", "GET", true);
    recordCacheEvent("/api/b", "POST", false);
    const stats = computeCacheStats();
    expect(stats).toHaveLength(2);
  });

  it("returns empty array when no events", () => {
    expect(computeCacheStats()).toEqual([]);
  });
});

describe("getCacheStatsByRoute", () => {
  it("returns stats for a specific route and method", () => {
    recordCacheEvent("/api/users", "GET", true);
    const stats = getCacheStatsByRoute("/api/users", "GET");
    expect(stats).not.toBeNull();
    expect(stats!.hitCount).toBe(1);
  });

  it("returns null when route not found", () => {
    expect(getCacheStatsByRoute("/api/missing", "GET")).toBeNull();
  });

  it("is case-insensitive for method", () => {
    recordCacheEvent("/api/items", "GET", false);
    const stats = getCacheStatsByRoute("/api/items", "get");
    expect(stats).not.toBeNull();
  });
});
