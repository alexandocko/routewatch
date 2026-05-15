import express, { Request, Response } from "express";
import request from "supertest";
import { throttleMiddleware } from "./throttleMiddleware";
import { addThrottleRule, clearThrottleRules } from "./throttle";
import { clearRecords } from "./middleware";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/items",
    status: 200,
    duration: 10,
    timestamp: Date.now(),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(throttleMiddleware);
  app.get("/api/items", (_req: Request, res: Response) => res.json({ ok: true }));
  return app;
}

beforeEach(() => {
  clearThrottleRules();
  clearRecords();
});

describe("throttleMiddleware", () => {
  it("passes through when no rules are defined", async () => {
    const res = await request(buildApp()).get("/api/items");
    expect(res.status).toBe(200);
  });

  it("passes through when rate is within limit", async () => {
    addThrottleRule({ route: "/api/items", method: "GET", maxRpm: 100 });
    const res = await request(buildApp()).get("/api/items");
    expect(res.status).toBe(200);
  });

  it("returns 429 when route exceeds throttle limit", async () => {
    // Add a rule with maxRpm of 0 to force a violation via evaluateThrottle
    addThrottleRule({ route: "/api/items", method: "GET", maxRpm: 0 });

    // Populate records so evaluateThrottle sees traffic
    const { recordRequest } = require("./middleware");
    if (typeof recordRequest === "function") {
      recordRequest(makeRecord());
    }

    // We mock evaluateThrottle to return a violation
    const throttleModule = require("./throttle");
    const original = throttleModule.evaluateThrottle;
    throttleModule.evaluateThrottle = () => [
      { route: "/api/items", method: "GET", maxRpm: 0, currentRpm: 5, exceeded: true },
    ];

    const res = await request(buildApp()).get("/api/items");
    expect(res.status).toBe(429);
    expect(res.body.error).toBe("Too Many Requests");

    throttleModule.evaluateThrottle = original;
  });
});
