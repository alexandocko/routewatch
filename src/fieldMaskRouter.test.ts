import express, { Express } from "express";
import request from "supertest";
import { createFieldMaskRouter } from "./fieldMaskRouter";
import { resetMaskConfig, setMaskConfig } from "./fieldMask";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/fieldmask", createFieldMaskRouter());
  return app;
}

beforeEach(() => {
  resetMaskConfig();
});

describe("GET /fieldmask/config", () => {
  it("returns the default config", async () => {
    const res = await request(buildApp()).get("/fieldmask/config");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("fields");
    expect(res.body).toHaveProperty("enabled");
  });
});

describe("PUT /fieldmask/config", () => {
  it("updates fields and replacement", async () => {
    const res = await request(buildApp())
      .put("/fieldmask/config")
      .send({ fields: ["password", "token"], replacement: "***" });
    expect(res.status).toBe(200);
    expect(res.body.fields).toContain("password");
    expect(res.body.replacement).toBe("***");
  });

  it("returns 400 if fields is not an array", async () => {
    const res = await request(buildApp())
      .put("/fieldmask/config")
      .send({ fields: "password" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fields must be an array/);
  });

  it("returns 400 if replacement is not a string", async () => {
    const res = await request(buildApp())
      .put("/fieldmask/config")
      .send({ replacement: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/replacement must be a string/);
  });

  it("returns 400 if enabled is not a boolean", async () => {
    const res = await request(buildApp())
      .put("/fieldmask/config")
      .send({ enabled: "yes" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/enabled must be a boolean/);
  });
});

describe("POST /fieldmask/reset", () => {
  it("resets config to defaults", async () => {
    setMaskConfig({ fields: ["secret"], enabled: false });
    const res = await request(buildApp()).post("/fieldmask/reset");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.config.enabled).toBe(true);
  });
});

describe("POST /fieldmask/preview", () => {
  it("returns masked object", async () => {
    setMaskConfig({ fields: ["password"], enabled: true });
    const res = await request(buildApp())
      .post("/fieldmask/preview")
      .send({ username: "alice", password: "s3cr3t" });
    expect(res.status).toBe(200);
    expect(res.body.original.password).toBe("s3cr3t");
    expect(res.body.masked.password).not.toBe("s3cr3t");
    expect(res.body.masked.username).toBe("alice");
  });

  it("returns 400 for non-object body", async () => {
    const res = await request(buildApp())
      .post("/fieldmask/preview")
      .send(["not", "an", "object"]);
    expect(res.status).toBe(400);
  });
});
