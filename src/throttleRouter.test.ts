import express from "express";
import request from "supertest";
import { createThrottleRouter } from "./throttleRouter";
import { clearThrottleRules } from "./throttle";
import { clearRecords } from "./middleware";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/throttle", createThrottleRouter());
  return app;
}

beforeEach(() => {
  clearThrottleRules();
  clearRecords();
});

describe("GET /throttle/rules", () => {
  it("returns empty array initially", async () => {
    const res = await request(buildApp()).get("/throttle/rules");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /throttle/rules", () => {
  it("creates a new throttle rule", async () => {
    const res = await request(buildApp())
      .post("/throttle/rules")
      .send({ route: "/api/data", method: "GET", maxRpm: 60 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ route: "/api/data", method: "GET", maxRpm: 60 });
    expect(res.body.id).toBeDefined();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(buildApp())
      .post("/throttle/rules")
      .send({ route: "/api/data" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /throttle/rules/:id", () => {
  it("removes an existing rule", async () => {
    const app = buildApp();
    const created = await request(app)
      .post("/throttle/rules")
      .send({ route: "/api/x", method: "POST", maxRpm: 30 });
    const id = created.body.id;
    const res = await request(app).delete(`/throttle/rules/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(buildApp()).delete("/throttle/rules/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /throttle/rules", () => {
  it("clears all rules", async () => {
    const app = buildApp();
    await request(app).post("/throttle/rules").send({ route: "/a", method: "GET", maxRpm: 10 });
    const res = await request(app).delete("/throttle/rules");
    expect(res.status).toBe(200);
    const list = await request(app).get("/throttle/rules");
    expect(list.body).toHaveLength(0);
  });
});

describe("GET /throttle/evaluate", () => {
  it("returns evaluation results", async () => {
    const res = await request(buildApp()).get("/throttle/evaluate");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
