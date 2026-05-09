import { describe, it, expect, beforeEach } from "vitest";
import {
  createPipeline,
  getPipeline,
  listPipelines,
  deletePipeline,
  clearPipelines,
  runPipeline,
} from "./pipeline";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/test",
    status: 200,
    duration: 50,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  clearPipelines();
});

describe("createPipeline", () => {
  it("creates and stores a pipeline", () => {
    const p = createPipeline("my-pipeline", []);
    expect(p.name).toBe("my-pipeline");
    expect(p.id).toBeDefined();
    expect(getPipeline(p.id)).toEqual(p);
  });

  it("assigns unique ids", () => {
    const a = createPipeline("a", []);
    const b = createPipeline("b", []);
    expect(a.id).not.toBe(b.id);
  });
});

describe("listPipelines", () => {
  it("returns all pipelines", () => {
    createPipeline("x", []);
    createPipeline("y", []);
    expect(listPipelines()).toHaveLength(2);
  });
});

describe("deletePipeline", () => {
  it("removes a pipeline", () => {
    const p = createPipeline("del", []);
    expect(deletePipeline(p.id)).toBe(true);
    expect(getPipeline(p.id)).toBeUndefined();
  });

  it("returns false for unknown id", () => {
    expect(deletePipeline("nope")).toBe(false);
  });
});

describe("runPipeline", () => {
  it("returns null for unknown pipeline", () => {
    expect(runPipeline("missing", [])).toBeNull();
  });

  it("applies stages in order", () => {
    const records = [
      makeRecord({ status: 200 }),
      makeRecord({ status: 404 }),
      makeRecord({ status: 500 }),
    ];
    const p = createPipeline("filter-errors", [
      { name: "only-errors", transform: (rs) => rs.filter((r) => r.status >= 400) },
      { name: "mark-slow", transform: (rs) => rs.map((r) => ({ ...r, duration: r.duration + 10 })) },
    ]);
    const result = runPipeline(p.id, records);
    expect(result).toHaveLength(2);
    expect(result![0].duration).toBe(60);
  });

  it("returns all records when no stages", () => {
    const records = [makeRecord(), makeRecord()];
    const p = createPipeline("passthrough", []);
    expect(runPipeline(p.id, records)).toHaveLength(2);
  });
});
