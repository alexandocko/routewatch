import express from "express";
import request from "supertest";
import { createBreadcrumbRouter } from "./breadcrumbRouter";
import { clearBreadcrumbs, recordBreadcrumb } from "./breadcrumb";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/breadcrumbs", createBreadcrumbRouter());
  return app;
}

beforeEach(() => {
  clearBreadcrumbs();
});

describe("GET /breadcrumbs", () => {
  it("returns empty list when no breadcrumbs", async () => {
    const res = await request(buildApp()).get("/breadcrumbs");
    expect(res.status).toBe(200);
    expect(res.body.breadcrumbs).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("returns all breadcrumbs", async () => {
    recordBreadcrumb({ sessionId: "s1", method: "GET", path: "/api/test", statusCode: 200, duration: 50 });
    const res = await request(buildApp()).get("/breadcrumbs");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

describe("GET /breadcrumbs/session/:sessionId", () => {
  it("returns 404 for unknown session", async () => {
    const res = await request(buildApp()).get("/breadcrumbs/session/unknown");
    expect(res.status).toBe(404);
  });

  it("returns breadcrumbs for a known session", async () => {
    recordBreadcrumb({ sessionId: "abc", method: "POST", path: "/api/items", statusCode: 201, duration: 80 });
    const res = await request(buildApp()).get("/breadcrumbs/session/abc");
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe("abc");
    expect(res.body.breadcrumbs.length).toBe(1);
  });
});

describe("POST /breadcrumbs", () => {
  it("returns 400 if required fields missing", async () => {
    const res = await request(buildApp()).post("/breadcrumbs").send({ sessionId: "s1" });
    expect(res.status).toBe(400);
  });

  it("creates a breadcrumb entry", async () => {
    const res = await request(buildApp())
      .post("/breadcrumbs")
      .send({ sessionId: "s2", method: "GET", path: "/api/health", statusCode: 200, duration: 10 });
    expect(res.status).toBe(201);
    expect(res.body.breadcrumb.sessionId).toBe("s2");
  });
});

describe("DELETE /breadcrumbs/session/:sessionId", () => {
  it("clears breadcrumbs for a session", async () => {
    recordBreadcrumb({ sessionId: "del1", method: "GET", path: "/x", statusCode: 200, duration: 5 });
    const res = await request(buildApp()).delete("/breadcrumbs/session/del1");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/del1/);
  });
});

describe("DELETE /breadcrumbs", () => {
  it("clears all breadcrumbs", async () => {
    recordBreadcrumb({ sessionId: "s3", method: "GET", path: "/y", statusCode: 200, duration: 5 });
    const res = await request(buildApp()).delete("/breadcrumbs");
    expect(res.status).toBe(200);
    const list = await request(buildApp()).get("/breadcrumbs");
    expect(list.body.total).toBe(0);
  });
});
