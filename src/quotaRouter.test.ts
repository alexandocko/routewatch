import express, { Express } from "express";
import request from "supertest";
import { createQuotaRouter } from "./quotaRouter";
import { clearQuotaRules } from "./quota";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/quota", createQuotaRouter());
  return app;
}

beforeEach(() => {
  clearQuotaRules();
});

describe("GET /quota", () => {
  it("returns empty array initially", async () => {
    const res = await request(buildApp()).get("/quota");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /quota", () => {
  it("adds a new quota rule", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/quota")
      .send({ route: "/api/items", maxRequests: 100, windowMs: 60000 });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    const list = await request(app).get("/quota");
    expect(list.body).toHaveLength(1);
    expect(list.body[0].route).toBe("/api/items");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(buildApp())
      .post("/quota")
      .send({ route: "/api/items" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /quota", () => {
  it("clears all quota rules", async () => {
    const app = buildApp();
    await request(app)
      .post("/quota")
      .send({ route: "/api/a", maxRequests: 10, windowMs: 1000 });
    await request(app).delete("/quota");
    const list = await request(app).get("/quota");
    expect(list.body).toHaveLength(0);
  });
});

describe("DELETE /quota/:route", () => {
  it("removes a specific rule by route", async () => {
    const app = buildApp();
    await request(app)
      .post("/quota")
      .send({ route: "/api/items", maxRequests: 5, windowMs: 1000 });
    await request(app).delete("/quota/%2Fapi%2Fitems");
    const list = await request(app).get("/quota");
    expect(list.body).toHaveLength(0);
  });
});

describe("GET /quota/status", () => {
  it("returns quota statuses for configured rules", async () => {
    const app = buildApp();
    await request(app)
      .post("/quota")
      .send({ route: "/api/items", maxRequests: 100, windowMs: 60000 });
    const res = await request(app).get("/quota/status");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("exceeded");
  });
});
