import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { RouteRecord } from "./types";

interface RouteStat {
  count: number;
  avgDuration: number;
  errorRate: number;
}

interface DiffEntry {
  route: string;
  method: string;
  before: RouteStat | null;
  after: RouteStat | null;
  delta: {
    count: number | null;
    avgDuration: number | null;
    errorRate: number | null;
  };
}

function buildStats(records: RouteRecord[]): Map<string, RouteStat> {
  const map = new Map<string, Map<string, number[]>>();

  for (const r of records) {
    const key = `${r.method}:${r.route}`;
    if (!map.has(key)) map.set(key, new Map());
    const inner = map.get(key)!;
    if (!inner.has("durations")) inner.set("durations", []);
    if (!inner.has("errors")) inner.set("errors", []);
    inner.get("durations")!.push(r.duration);
    inner.get("errors")!.push(r.status >= 400 ? 1 : 0);
  }

  const stats = new Map<string, RouteStat>();
  for (const [key, inner] of map.entries()) {
    const durations = inner.get("durations") ?? [];
    const errors = inner.get("errors") ?? [];
    const count = durations.length;
    const avgDuration = count > 0 ? durations.reduce((a, b) => a + b, 0) / count : 0;
    const errorRate = count > 0 ? errors.reduce((a, b) => a + b, 0) / count : 0;
    stats.set(key, { count, avgDuration, errorRate });
  }

  return stats;
}

export function computeDiff(before: RouteRecord[], after: RouteRecord[]): DiffEntry[] {
  const beforeStats = buildStats(before);
  const afterStats = buildStats(after);
  const allKeys = new Set([...beforeStats.keys(), ...afterStats.keys()]);

  const results: DiffEntry[] = [];

  for (const key of allKeys) {
    const [method, ...routeParts] = key.split(":");
    const route = routeParts.join(":");
    const b = beforeStats.get(key) ?? null;
    const a = afterStats.get(key) ?? null;

    results.push({
      route,
      method,
      before: b,
      after: a,
      delta: {
        count: b && a ? a.count - b.count : null,
        avgDuration: b && a ? parseFloat((a.avgDuration - b.avgDuration).toFixed(2)) : null,
        errorRate: b && a ? parseFloat((a.errorRate - b.errorRate).toFixed(4)) : null,
      },
    });
  }

  return results.sort((a, b) => a.route.localeCompare(b.route));
}

export function createDiffRouter(): Router {
  const router = Router();

  router.post("/diff", (req: Request, res: Response) => {
    const { beforeIds, afterIds } = req.body as {
      beforeIds?: string[];
      afterIds?: string[];
    };

    const all = getRecords();

    const before = beforeIds ? all.filter((r) => beforeIds.includes(r.id)) : [];
    const after = afterIds ? all.filter((r) => afterIds.includes(r.id)) : all;

    const diff = computeDiff(before, after);
    res.json({ diff });
  });

  return router;
}
