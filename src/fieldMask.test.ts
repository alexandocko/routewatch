import {
  setMaskConfig,
  getMaskConfig,
  resetMaskConfig,
  maskObject,
  applyFieldMask,
  applyFieldMaskToAll,
} from "./fieldMask";
import { RouteRecord } from "./types";

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: "GET",
    path: "/api/users",
    status: 200,
    duration: 42,
    timestamp: Date.now(),
    ...overrides,
  } as RouteRecord;
}

beforeEach(() => {
  resetMaskConfig();
});

describe("getMaskConfig / setMaskConfig", () => {
  it("returns default config initially", () => {
    const config = getMaskConfig();
    expect(config.fields).toEqual([]);
    expect(config.replacement).toBe("[REDACTED]");
  });

  it("updates config with setMaskConfig", () => {
    setMaskConfig({ fields: ["token", "password"], replacement: "***" });
    const config = getMaskConfig();
    expect(config.fields).toEqual(["token", "password"]);
    expect(config.replacement).toBe("***");
  });

  it("uses default replacement if not provided", () => {
    setMaskConfig({ fields: ["secret"] });
    expect(getMaskConfig().replacement).toBe("[REDACTED]");
  });
});

describe("maskObject", () => {
  it("masks specified top-level fields", () => {
    const obj = { name: "Alice", password: "s3cr3t", age: 30 };
    const result = maskObject(obj, ["password"], "[REDACTED]");
    expect(result.password).toBe("[REDACTED]");
    expect(result.name).toBe("Alice");
    expect(result.age).toBe(30);
  });

  it("masks nested fields recursively", () => {
    const obj = { user: { token: "abc123", name: "Bob" } };
    const result = maskObject(obj, ["token"], "[REDACTED]") as any;
    expect(result.user.token).toBe("[REDACTED]");
    expect(result.user.name).toBe("Bob");
  });

  it("returns non-object values unchanged", () => {
    const result = maskObject({} as any, ["x"], "[R]");
    expect(result).toEqual({});
  });
});

describe("applyFieldMask", () => {
  it("returns record unchanged when no fields configured", () => {
    const record = makeRecord({ path: "/api/login" });
    const result = applyFieldMask(record);
    expect(result).toEqual(record);
  });

  it("masks top-level record fields", () => {
    setMaskConfig({ fields: ["path"] });
    const record = makeRecord({ path: "/api/secret" });
    const result = applyFieldMask(record);
    expect(result.path).toBe("[REDACTED]");
    expect(result.method).toBe("GET");
  });

  it("masks fields inside meta", () => {
    setMaskConfig({ fields: ["authorization"] });
    const record = makeRecord({ meta: { authorization: "Bearer xyz" } } as any);
    const result = applyFieldMask(record) as any;
    expect(result.meta.authorization).toBe("[REDACTED]");
  });
});

describe("applyFieldMaskToAll", () => {
  it("applies mask to all records", () => {
    setMaskConfig({ fields: ["method"] });
    const records = [makeRecord(), makeRecord({ method: "POST" })];
    const results = applyFieldMaskToAll(records);
    expect(results[0].method).toBe("[REDACTED]");
    expect(results[1].method).toBe("[REDACTED]");
  });

  it("returns empty array for empty input", () => {
    expect(applyFieldMaskToAll([])).toEqual([]);
  });
});
