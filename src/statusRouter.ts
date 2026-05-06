import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { RouteRecord } from "./types";

export interface StatusSummary {
  totalRequests: number;
  statusBreakdown: Record<number, number>;
  errorRate: number;
  topErrorRoutes: Array<{ method: string; path: string; count: number; status: number }>;
}

export function computeStatusSummary(records: RouteRecord[]): StatusSummary {
  const statusBreakdown: Record<number, number> = {};
  const errorRouteMap: Record<string, { method: string; path: string; count: number; status: number }> = {};

  for (const r of records) {
    const code = r.status;
    statusBreakdown[code] = (statusBreakdown[code] ?? 0) + 1;

    if (code >= 400) {
      const key = `${r.method}:${r.path}:${code}`;
      if (!errorRouteMap[key]) {
        errorRouteMap[key] = { method: r.method, path: r.path, count: 0, status: code };
      }
      errorRouteMap[key].count += 1;
    }
  }

  const totalRequests = records.length;
  const errorCount = Object.values(statusBreakdown)
    .filter((_, i) => Number(Object.keys(statusBreakdown)[i]) >= 400)
    .reduce((a, b) => a + b, 0);

  const errorCountDirect = records.filter((r) => r.status >= 400).length;
  const errorRate = totalRequests > 0 ? errorCountDirect / totalRequests : 0;

  const topErrorRoutes = Object.values(errorRouteMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { totalRequests, statusBreakdown, errorRate, topErrorRoutes };
}

export function createStatusRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const records = getRecords();
    const summary = computeStatusSummary(records);
    res.json(summary);
  });

  router.get("/breakdown", (_req: Request, res: Response) => {
    const records = getRecords();
    const { statusBreakdown } = computeStatusSummary(records);
    res.json(statusBreakdown);
  });

  router.get("/errors", (_req: Request, res: Response) => {
    const records = getRecords();
    const { topErrorRoutes, errorRate } = computeStatusSummary(records);
    res.json({ errorRate, topErrorRoutes });
  });

  return router;
}
