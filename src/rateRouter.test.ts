import express, { Application } from "express";
import request from "supertest";
import { routewatch, clearRecords } from "./middleware";
import { createRateRouter, computeRates } from "./rateRouter";
import { RouteRecord } from "./types";

function buildApp(): Application {
  const app = express();
  app.use(routewatch());
  app.get("/hello", (_req, res) => res.json({ ok: true }));
  app.post("/submit", (_req, res) => res.json({ ok: true }));
  app.use(createRateRouter());
  return app;
}

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/test",
    statusCode: 200,
    duration: 10,
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => clearRecords());

describe("computeRates", () => {
  it("returns empty array for no records", () => {
    expect(computeRates([])).toEqual([]);
  });

  it("counts requests within the window", () => {
    const now = Date.now();
    const records = [
      makeRecord({ timestamp: now - 10_000 }),
      makeRecord({ timestamp: now - 20_000 }),
      makeRecord({ timestamp: now - 70_000 }),
    ];
    const rates = computeRates(records, 60_000);
    expect(rates).toHaveLength(1);
    expect(rates[0].totalRequests).toBe(3);
    expect(rates[0].requestsPerMinute).toBe(2);
  });

  it("groups by method and path", () => {
    const now = Date.now();
    const records = [
      makeRecord({ method: "GET", path: "/a", timestamp: now - 1000 }),
      makeRecord({ method: "POST", path: "/a", timestamp: now - 1000 }),
    ];
    const rates = computeRates(records, 60_000);
    expect(rates).toHaveLength(2);
    const methods = rates.map((r) => r.method);
    expect(methods).toContain("GET");
    expect(methods).toContain("POST");
  });
});

describe("GET /rates", () => {
  it("returns rates after requests", async () => {
    const app = buildApp();
    await request(app).get("/hello");
    await request(app).get("/hello");
    const res = await request(app).get("/rates");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rates");
    expect(res.body).toHaveProperty("windowMs", 60000);
    const helloRate = res.body.rates.find(
      (r: { method: string; path: string }) =>
        r.method === "GET" && r.path === "/hello"
    );
    expect(helloRate).toBeDefined();
    expect(helloRate.totalRequests).toBeGreaterThanOrEqual(2);
  });

  it("accepts custom windowMs query param", async () => {
    const app = buildApp();
    const res = await request(app).get("/rates?windowMs=30000");
    expect(res.status).toBe(200);
    expect(res.body.windowMs).toBe(30000);
  });

  it("returns 400 for invalid windowMs", async () => {
    const app = buildApp();
    const res = await request(app).get("/rates?windowMs=abc");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
