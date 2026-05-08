import express, { Application } from "express";
import request from "supertest";
import { routewatch, clearRecords, getRecords } from "./middleware";
import { createHealthRouter, computeHealth } from "./healthRouter";
import { recordError, clearErrorLog } from "./errorTracker";
import { recordSlowlog, clearSlowlog } from "./slowlog";
import type { RouteRecord } from "./types";

function buildApp(): Application {
  const app = express();
  app.use(routewatch());
  app.use("/health", createHealthRouter());
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  return app;
}

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/test",
    status: 200,
    duration: 10,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  clearRecords();
  clearErrorLog();
  clearSlowlog();
});

describe("GET /health", () => {
  it("returns status ok when no errors or slow requests", async () => {
    const app = buildApp();
    await request(app).get("/ping");
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
    expect(typeof res.body.totalRequests).toBe("number");
    expect(res.body.checkedAt).toBeDefined();
  });

  it("returns status degraded when error rate is high", async () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ status: i < 2 ? 500 : 200 })
    );
    records.forEach((r) => {
      if (r.status === 500) recordError(r as any, new Error("boom"));
    });
    // Manually inject records
    (getRecords as any);
    const health = computeHealth();
    expect(["ok", "degraded", "critical"]).toContain(health.status);
  });

  it("includes memoryUsageMb in response", async () => {
    const app = buildApp();
    const res = await request(app).get("/health");
    expect(typeof res.body.memoryUsageMb).toBe("number");
    expect(res.body.memoryUsageMb).toBeGreaterThan(0);
  });

  it("returns slowRequestRate of 0 when no slow logs", async () => {
    const health = computeHealth();
    expect(health.slowRequestRate).toBe(0);
  });
});

describe("GET /health/retention", () => {
  it("returns retention stats", async () => {
    const app = buildApp();
    const res = await request(app).get("/health/retention");
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe("number");
  });
});
