import express, { Application } from "express";
import request from "supertest";
import { createCacheRouter } from "./cacheRouter";
import { recordCacheEvent, clearCacheEvents } from "./cache";

function buildApp(): Application {
  const app = express();
  app.use(express.json());
  app.use("/cache", createCacheRouter());
  return app;
}

function makeEvent(
  route: string,
  hit: boolean,
  durationMs = 10
) {
  recordCacheEvent({ route, hit, durationMs, timestamp: Date.now() });
}

beforeEach(() => {
  clearCacheEvents();
});

describe("GET /cache/events", () => {
  it("returns empty list when no events recorded", async () => {
    const res = await request(buildApp()).get("/cache/events");
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("returns recorded events", async () => {
    makeEvent("/api/users", true);
    makeEvent("/api/users", false);
    const res = await request(buildApp()).get("/cache/events");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });
});

describe("GET /cache/stats", () => {
  it("returns aggregate stats", async () => {
    makeEvent("/api/items", true, 5);
    makeEvent("/api/items", true, 10);
    makeEvent("/api/items", false, 50);
    const res = await request(buildApp()).get("/cache/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalRequests");
    expect(res.body).toHaveProperty("hitRate");
  });
});

describe("GET /cache/stats/:route", () => {
  it("returns 404 for unknown route", async () => {
    const res = await request(buildApp()).get(
      "/cache/stats/" + encodeURIComponent("/unknown")
    );
    expect(res.status).toBe(404);
  });

  it("returns stats for a known route", async () => {
    makeEvent("/api/orders", true, 8);
    makeEvent("/api/orders", false, 30);
    const res = await request(buildApp()).get(
      "/cache/stats/" + encodeURIComponent("/api/orders")
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("route", "/api/orders");
    expect(res.body).toHaveProperty("hits");
    expect(res.body).toHaveProperty("misses");
  });
});

describe("DELETE /cache/events", () => {
  it("clears all events", async () => {
    makeEvent("/api/users", true);
    const app = buildApp();
    await request(app).delete("/cache/events").expect(200);
    const res = await request(app).get("/cache/events");
    expect(res.body.total).toBe(0);
  });
});
