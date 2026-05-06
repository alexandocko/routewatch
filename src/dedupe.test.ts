import { dedupeRecords, countDuplicates } from "./dedupe";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/test",
    statusCode: 200,
    duration: 10,
    timestamp: Date.now(),
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("dedupeRecords", () => {
  it("returns all records when none are duplicates", () => {
    const now = 1000000;
    const records = [
      makeRecord({ path: "/a", timestamp: now }),
      makeRecord({ path: "/b", timestamp: now + 100 }),
      makeRecord({ path: "/c", timestamp: now + 200 }),
    ];
    expect(dedupeRecords(records)).toHaveLength(3);
  });

  it("removes duplicate within default 1000ms window", () => {
    const now = 1000000;
    const records = [
      makeRecord({ method: "GET", path: "/api", timestamp: now }),
      makeRecord({ method: "GET", path: "/api", timestamp: now + 400 }),
      makeRecord({ method: "GET", path: "/api", timestamp: now + 800 }),
    ];
    const result = dedupeRecords(records);
    expect(result).toHaveLength(1);
  });

  it("keeps record after window has elapsed", () => {
    const now = 1000000;
    const records = [
      makeRecord({ method: "GET", path: "/api", timestamp: now }),
      makeRecord({ method: "GET", path: "/api", timestamp: now + 1500 }),
    ];
    const result = dedupeRecords(records, { windowMs: 1000 });
    expect(result).toHaveLength(2);
  });

  it("respects custom fields for deduplication", () => {
    const now = 1000000;
    const records = [
      makeRecord({ method: "GET", path: "/api", statusCode: 200, timestamp: now }),
      makeRecord({ method: "GET", path: "/api", statusCode: 500, timestamp: now + 100 }),
    ];
    // With statusCode included, these are different keys
    const result = dedupeRecords(records, { fields: ["method", "path", "statusCode"] });
    expect(result).toHaveLength(2);
  });

  it("handles empty input", () => {
    expect(dedupeRecords([])).toEqual([]);
  });
});

describe("countDuplicates", () => {
  it("returns empty object when no duplicates", () => {
    const now = 1000000;
    const records = [
      makeRecord({ path: "/a", timestamp: now }),
      makeRecord({ path: "/b", timestamp: now + 100 }),
    ];
    expect(countDuplicates(records)).toEqual({});
  });

  it("counts duplicates within window", () => {
    const now = 1000000;
    const records = [
      makeRecord({ method: "GET", path: "/api", timestamp: now }),
      makeRecord({ method: "GET", path: "/api", timestamp: now + 200 }),
      makeRecord({ method: "GET", path: "/api", timestamp: now + 400 }),
    ];
    const counts = countDuplicates(records, { windowMs: 1000 });
    expect(counts["GET|/api"]).toBe(3);
  });

  it("handles empty input", () => {
    expect(countDuplicates([])).toEqual({});
  });
});
