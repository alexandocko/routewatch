import express, { Application } from "express";
import request from "supertest";
import { routewatch, clearRecords } from "./middleware";
import { createHeatmapRouter } from "./heatmapRouter";
import { RouteRecord } from "./types";

function buildApp(): Application {
  const app = express();
  app.use(routewatch());
  app.get("/users", (_req, res) => res.json({ ok: true }));
  app.get("/posts", (_req, res) => res.json({ ok: true }));
  app.use("/heatmap", createHeatmapRouter());
  return app;
}

function makeRecord(route: string, hour: number): RouteRecord {
  const ts = new Date();
  ts.setHours(hour, 0, 0, 0);
  return {
    method: "GET",
    route,
    status: 200,
    duration: 10,
    timestamp: ts.toISOString(),
  };
}

describe("createHeatmapRouter", () => {
  beforeEach(() => clearRecords());

  it("GET /heatmap returns heatmap object", async () => {
    const app = buildApp();
    await request(app).get("/users");
    await request(app).get("/posts");

    const res = await request(app).get("/heatmap");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("heatmap");
    expect(typeof res.body.heatmap).toBe("object");
  });

  it("GET /heatmap returns empty heatmap when no records exist", async () => {
    const app = buildApp();
    const res = await request(app).get("/heatmap");
    expect(res.status).toBe(200);
    expect(res.body.heatmap).toEqual({});
  });

  it("GET /heatmap/:route returns heatmap for specific route", async () => {
    const app = buildApp();
    await request(app).get("/users");
    await request(app).get("/users");
    await request(app).get("/posts");

    const res = await request(app).get("/heatmap/users");
    expect(res.status).toBe(200);
    expect(res.body.route).toBe("/users");
    expect(res.body).toHaveProperty("heatmap");
  });

  it("GET /heatmap/:route returns 404 for unknown route", async () => {
    const app = buildApp();
    const res = await request(app).get("/heatmap/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("heatmap data is keyed by route and contains hour buckets", async () => {
    const app = buildApp();
    await request(app).get("/users");

    const res = await request(app).get("/heatmap");
    expect(res.status).toBe(200);
    const heatmap = res.body.heatmap;
    const routeKey = Object.keys(heatmap).find((k) => k === "/users");
    expect(routeKey).toBeDefined();
    const hours = heatmap["/users"];
    expect(Array.isArray(hours)).toBe(true);
    expect(hours.length).toBe(24);
  });
});
