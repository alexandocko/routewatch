import {
  recordError,
  getErrorEntries,
  clearErrorLog,
  getErrorSummary,
} from "./errorTracker";
import type { RouteRecord } from "./types";

/** Helper to build a minimal RouteRecord for testing */
function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/test",
    statusCode: 500,
    durationMs: 120,
    timestamp: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  clearErrorLog();
});

describe("recordError", () => {
  it("stores an error entry from a 5xx record", () => {
    const record = makeRecord({ statusCode: 500, path: "/api/fail" });
    recordError(record);
    const entries = getErrorEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].path).toBe("/api/fail");
    expect(entries[0].statusCode).toBe(500);
  });

  it("stores multiple error entries independently", () => {
    recordError(makeRecord({ statusCode: 500 }));
    recordError(makeRecord({ statusCode: 503, path: "/api/other" }));
    expect(getErrorEntries()).toHaveLength(2);
  });

  it("does not store non-error records (2xx)", () => {
    const record = makeRecord({ statusCode: 200 });
    recordError(record);
    expect(getErrorEntries()).toHaveLength(0);
  });

  it("does not store 4xx records", () => {
    const record = makeRecord({ statusCode: 404 });
    recordError(record);
    expect(getErrorEntries()).toHaveLength(0);
  });
});

describe("clearErrorLog", () => {
  it("removes all stored error entries", () => {
    recordError(makeRecord({ statusCode: 500 }));
    recordError(makeRecord({ statusCode: 502 }));
    clearErrorLog();
    expect(getErrorEntries()).toHaveLength(0);
  });
});

describe("getErrorSummary", () => {
  it("returns counts grouped by status code", () => {
    recordError(makeRecord({ statusCode: 500 }));
    recordError(makeRecord({ statusCode: 500 }));
    recordError(makeRecord({ statusCode: 503 }));
    const summary = getErrorSummary();
    expect(summary["500"]).toBe(2);
    expect(summary["503"]).toBe(1);
  });

  it("returns empty object when no errors recorded", () => {
    const summary = getErrorSummary();
    expect(summary).toEqual({});
  });

  it("counts errors grouped by path and status", () => {
    recordError(makeRecord({ statusCode: 500, path: "/a" }));
    recordError(makeRecord({ statusCode: 500, path: "/b" }));
    const entries = getErrorEntries();
    expect(entries.map((e) => e.path)).toContain("/a");
    expect(entries.map((e) => e.path)).toContain("/b");
  });

  it("includes most recent error timestamp in summary", () => {
    const early = makeRecord({
      statusCode: 500,
      timestamp: new Date("2024-01-15T09:00:00Z"),
    });
    const late = makeRecord({
      statusCode: 500,
      timestamp: new Date("2024-01-15T11:00:00Z"),
    });
    recordError(early);
    recordError(late);
    const entries = getErrorEntries();
    const timestamps = entries.map((e) => e.timestamp.getTime());
    expect(Math.max(...timestamps)).toBe(
      new Date("2024-01-15T11:00:00Z").getTime()
    );
  });
});
