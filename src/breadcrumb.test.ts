import {
  recordBreadcrumb,
  getBreadcrumbBySession,
  listBreadcrumbs,
  deleteBreadcrumb,
  clearBreadcrumbs,
  BreadcrumbInput,
} from "./breadcrumb";

function makeRecord(overrides: Partial<BreadcrumbInput> = {}): BreadcrumbInput {
  return {
    sessionId: "session-1",
    method: "GET",
    path: "/api/test",
    statusCode: 200,
    duration: 42,
    ...overrides,
  };
}

beforeEach(() => {
  clearBreadcrumbs();
});

describe("recordBreadcrumb", () => {
  it("stores a breadcrumb and returns it with id and timestamp", () => {
    const entry = recordBreadcrumb(makeRecord());
    expect(entry.id).toMatch(/^bc-/);
    expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    expect(entry.sessionId).toBe("session-1");
  });

  it("increments id counter across multiple calls", () => {
    const a = recordBreadcrumb(makeRecord());
    const b = recordBreadcrumb(makeRecord());
    expect(a.id).not.toBe(b.id);
  });

  it("stores optional meta field", () => {
    const entry = recordBreadcrumb(makeRecord({ meta: { user: "alice" } }));
    expect(entry.meta).toEqual({ user: "alice" });
  });
});

describe("getBreadcrumbBySession", () => {
  it("returns only breadcrumbs for the given session", () => {
    recordBreadcrumb(makeRecord({ sessionId: "s1" }));
    recordBreadcrumb(makeRecord({ sessionId: "s2" }));
    recordBreadcrumb(makeRecord({ sessionId: "s1", path: "/api/other" }));
    const result = getBreadcrumbBySession("s1");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.sessionId === "s1")).toBe(true);
  });

  it("returns empty array for unknown session", () => {
    expect(getBreadcrumbBySession("nope")).toEqual([]);
  });
});

describe("listBreadcrumbs", () => {
  it("returns all stored breadcrumbs", () => {
    recordBreadcrumb(makeRecord({ sessionId: "a" }));
    recordBreadcrumb(makeRecord({ sessionId: "b" }));
    expect(listBreadcrumbs()).toHaveLength(2);
  });

  it("returns a copy, not the internal store", () => {
    const list = listBreadcrumbs();
    list.push({} as any);
    expect(listBreadcrumbs()).toHaveLength(0);
  });
});

describe("deleteBreadcrumb", () => {
  it("removes all breadcrumbs for a session", () => {
    recordBreadcrumb(makeRecord({ sessionId: "del" }));
    recordBreadcrumb(makeRecord({ sessionId: "keep" }));
    deleteBreadcrumb("del");
    expect(getBreadcrumbBySession("del")).toHaveLength(0);
    expect(getBreadcrumbBySession("keep")).toHaveLength(1);
  });
});

describe("clearBreadcrumbs", () => {
  it("removes all breadcrumbs", () => {
    recordBreadcrumb(makeRecord());
    recordBreadcrumb(makeRecord());
    clearBreadcrumbs();
    expect(listBreadcrumbs()).toHaveLength(0);
  });
});
