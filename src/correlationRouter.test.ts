import express, { Express } from "express";
import request from "supertest";
import { computeCorrelations, createCorrelationRouter } from "./correlationRouter";
import { RouteRecord } from "./types";
import * as middleware from "./middleware";

function makeRecord(route: string, timestamp: number): RouteRecord {
  return {
    method: "GET",
    route,
    path: route,
    statusCode: 200,
    duration: 10,
    timestamp,
    tags: [],
  };
}

function buildApp(): Express {
  const app = express();
  app.use("/correlations", createCorrelationRouter());
  return app;
}

describe("computeCorrelations", () => {
  it("returns empty array for no records", () => {
    expect(computeCorrelations([])).toEqual([]);
  });

  it("detects co-occurring routes within window", () => {
    const records = [
      makeRecord("/a", 1000),
      makeRecord("/b", 1500),
      makeRecord("/a", 6000),
      makeRecord("/c", 6200),
    ];
    const result = computeCorrelations(records, 5000);
    const ab = result.find(
      (p) => (p.routeA === "/a" && p.routeB === "/b") || (p.routeA === "/b" && p.routeB === "/a")
    );
    expect(ab).toBeDefined();
    expect(ab!.coOccurrences).toBe(1);
    expect(ab!.avgTimeDeltaMs).toBe(500);
  });

  it("excludes pairs outside the time window", () => {
    const records = [
      makeRecord("/x", 0),
      makeRecord("/y", 10000),
    ];
    const result = computeCorrelations(records, 5000);
    expect(result).toHaveLength(0);
  });

  it("sorts by coOccurrences descending", () => {
    const records = [
      makeRecord("/a", 100),
      makeRecord("/b", 200),
      makeRecord("/a", 300),
      makeRecord("/b", 350),
      makeRecord("/c", 400),
    ];
    const result = computeCorrelations(records, 5000);
    expect(result[0].coOccurrences).toBeGreaterThanOrEqual(result[1]?.coOccurrences ?? 0);
  });
});

describe("createCorrelationRouter", () => {
  let getRecordsSpy: jest.SpyInstance;

  beforeEach(() => {
    getRecordsSpy = jest.spyOn(middleware, "getRecords").mockReturnValue([
      makeRecord("/api/users", 1000),
      makeRecord("/api/posts", 1800),
      makeRecord("/api/users", 7000),
    ]);
  });

  afterEach(() => {
    getRecordsSpy.mockRestore();
  });

  it("GET /correlations returns correlation data", async () => {
    const app = buildApp();
    const res = await request(app).get("/correlations");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("correlations");
    expect(res.body).toHaveProperty("windowMs");
    expect(Array.isArray(res.body.correlations)).toBe(true);
  });

  it("GET /correlations/route returns filtered results", async () => {
    const app = buildApp();
    const res = await request(app).get("/correlations/route?name=/api/users");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("/api/users");
    expect(Array.isArray(res.body.correlations)).toBe(true);
  });

  it("GET /correlations/route returns 400 without name", async () => {
    const app = buildApp();
    const res = await request(app).get("/correlations/route");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });
});
