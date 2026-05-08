import express, { Express } from "express";
import request from "supertest";
import { createDiffRouter, computeDiff } from "./diffRouter";
import { clearRecords, getRecords } from "./middleware";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    id: Math.random().toString(36).slice(2),
    method: "GET",
    route: "/api/test",
    path: "/api/test",
    status: 200,
    duration: 100,
    timestamp: Date.now(),
    tags: [],
    ...overrides,
  };
}

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/__routewatch", createDiffRouter());
  return app;
}

describe("computeDiff", () => {
  it("returns empty array when both sets are empty", () => {
    expect(computeDiff([], [])).toEqual([]);
  });

  it("marks routes only in after as new (before: null)", () => {
    const after = [makeRecord({ route: "/api/new", method: "GET", duration: 50, status: 200 })];
    const result = computeDiff([], after);
    expect(result).toHaveLength(1);
    expect(result[0].before).toBeNull();
    expect(result[0].after).not.toBeNull();
    expect(result[0].delta.count).toBeNull();
  });

  it("marks routes only in before as removed (after: null)", () => {
    const before = [makeRecord({ route: "/api/old", method: "DELETE", duration: 80, status: 204 })];
    const result = computeDiff(before, []);
    expect(result).toHaveLength(1);
    expect(result[0].after).toBeNull();
    expect(result[0].before).not.toBeNull();
  });

  it("computes deltas for shared routes", () => {
    const before = [
      makeRecord({ route: "/api/items", method: "GET", duration: 100, status: 200 }),
      makeRecord({ route: "/api/items", method: "GET", duration: 200, status: 500 }),
    ];
    const after = [
      makeRecord({ route: "/api/items", method: "GET", duration: 50, status: 200 }),
    ];
    const result = computeDiff(before, after);
    expect(result).toHaveLength(1);
    const entry = result[0];
    expect(entry.delta.count).toBe(-1);
    expect(entry.delta.avgDuration).toBeLessThan(0);
    expect(entry.before!.errorRate).toBeCloseTo(0.5);
    expect(entry.after!.errorRate).toBe(0);
  });

  it("handles multiple routes correctly", () => {
    const before = [makeRecord({ route: "/a", method: "GET", duration: 10, status: 200 })];
    const after = [
      makeRecord({ route: "/a", method: "GET", duration: 20, status: 200 }),
      makeRecord({ route: "/b", method: "POST", duration: 30, status: 201 }),
    ];
    const result = computeDiff(before, after);
    expect(result).toHaveLength(2);
    const routeA = result.find((r) => r.route === "/a");
    expect(routeA?.delta.avgDuration).toBe(10);
  });
});

describe("POST /__routewatch/diff", () => {
  it("returns diff with empty body", async () => {
    const app = buildApp();
    const res = await request(app).post("/__routewatch/diff").send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("diff");
    expect(Array.isArray(res.body.diff)).toBe(true);
  });

  it("responds with 200 and a diff array", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/__routewatch/diff")
      .send({ beforeIds: [], afterIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.diff).toEqual([]);
  });
});
