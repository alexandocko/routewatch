import express from "express";
import request from "supertest";
import { getRecords, clearRecords, routewatch } from "./middleware";
import { createStatusRouter, computeStatusSummary } from "./statusRouter";
import { RouteRecord } from "./types";

function makeRecord(method: string, path: string, status: number, duration = 50): RouteRecord {
  return { method, path, status, duration, timestamp: Date.now(), query: {}, tags: [] };
}

function buildApp() {
  const app = express();
  app.use(routewatch());
  app.use("/_rw/status", createStatusRouter());
  app.get("/ok", (_req, res) => res.sendStatus(200));
  app.get("/fail", (_req, res) => res.sendStatus(500));
  app.get("/notfound", (_req, res) => res.sendStatus(404));
  return app;
}

describe("computeStatusSummary", () => {
  it("returns zeroed summary for empty records", () => {
    const result = computeStatusSummary([]);
    expect(result.totalRequests).toBe(0);
    expect(result.errorRate).toBe(0);
    expect(result.topErrorRoutes).toHaveLength(0);
  });

  it("counts status codes correctly", () => {
    const records = [
      makeRecord("GET", "/a", 200),
      makeRecord("GET", "/a", 200),
      makeRecord("GET", "/b", 404),
      makeRecord("POST", "/c", 500),
    ];
    const result = computeStatusSummary(records);
    expect(result.statusBreakdown[200]).toBe(2);
    expect(result.statusBreakdown[404]).toBe(1);
    expect(result.statusBreakdown[500]).toBe(1);
    expect(result.totalRequests).toBe(4);
  });

  it("calculates error rate", () => {
    const records = [
      makeRecord("GET", "/a", 200),
      makeRecord("GET", "/b", 500),
    ];
    const result = computeStatusSummary(records);
    expect(result.errorRate).toBeCloseTo(0.5);
  });

  it("aggregates top error routes", () => {
    const records = [
      makeRecord("GET", "/fail", 500),
      makeRecord("GET", "/fail", 500),
      makeRecord("GET", "/missing", 404),
    ];
    const result = computeStatusSummary(records);
    expect(result.topErrorRoutes[0].path).toBe("/fail");
    expect(result.topErrorRoutes[0].count).toBe(2);
  });
});

describe("createStatusRouter", () => {
  beforeEach(() => clearRecords());

  it("GET /_rw/status returns summary", async () => {
    const app = buildApp();
    await request(app).get("/ok");
    await request(app).get("/fail");
    const res = await request(app).get("/_rw/status");
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.errorRate).toBe("number");
  });

  it("GET /_rw/status/breakdown returns status code map", async () => {
    const app = buildApp();
    await request(app).get("/ok");
    const res = await request(app).get("/_rw/status/breakdown");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("GET /_rw/status/errors returns error routes", async () => {
    const app = buildApp();
    await request(app).get("/fail");
    const res = await request(app).get("/_rw/status/errors");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topErrorRoutes)).toBe(true);
  });
});
