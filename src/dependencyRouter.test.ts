import express from "express";
import request from "supertest";
import { createDependencyRouter } from "./dependency.router";
import { RouteRecord } from "./types";
import * as middleware from "./middleware";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/users",
    status: 200,
    duration: 20,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use("/dependencies", createDependencyRouter());
  return app;
}

describe("createDependencyRouter", () => {
  let getRecordsSpy: jest.SpyInstance;

  beforeEach(() => {
    getRecordsSpy = jest.spyOn(middleware, "getRecords");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("GET / returns all dependency data", async () => {
    getRecordsSpy.mockReturnValue([
      makeRecord({ path: "/api/users", referer: "/api/orders" }),
      makeRecord({ path: "/api/orders", referer: "/api/users" }),
    ]);

    const res = await request(buildApp()).get("/dependencies");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET / returns empty array when no records", async () => {
    getRecordsSpy.mockReturnValue([]);
    const res = await request(buildApp()).get("/dependencies");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /:route returns 404 for unknown route", async () => {
    getRecordsSpy.mockReturnValue([]);
    const res = await request(buildApp()).get("/dependencies/%2Fapi%2Funknown");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /:route/callers returns callers list", async () => {
    getRecordsSpy.mockReturnValue([
      makeRecord({ path: "/api/users", referer: "/api/orders" }),
      makeRecord({ path: "/api/orders", referer: "/api/users" }),
    ]);

    const res = await request(buildApp()).get(
      "/dependencies/%2Fapi%2Fusers/callers"
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("route");
    expect(res.body).toHaveProperty("callers");
    expect(Array.isArray(res.body.callers)).toBe(true);
  });
});
