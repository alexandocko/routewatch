import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { RouteRecord } from "./types";

export interface RateStat {
  method: string;
  path: string;
  requestsPerMinute: number;
  totalRequests: number;
  windowMs: number;
}

export function computeRates(records: RouteRecord[], windowMs = 60_000): RateStat[] {
  const now = Date.now();
  const cutoff = now - windowMs;

  const windowRecords = records.filter((r) => r.timestamp >= cutoff);

  const grouped: Record<string, RouteRecord[]> = {};
  for (const record of windowRecords) {
    const key = `${record.method}:${record.path}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(record);
  }

  const allKeys = new Set(records.map((r) => `${r.method}:${r.path}`));

  return Array.from(allKeys).map((key) => {
    const [method, path] = key.split(/:(.+)/);
    const windowCount = (grouped[key] ?? []).length;
    const totalCount = records.filter(
      (r) => r.method === method && r.path === path
    ).length;
    const requestsPerMinute = parseFloat(
      ((windowCount / windowMs) * 60_000).toFixed(2)
    );
    return {
      method,
      path,
      requestsPerMinute,
      totalRequests: totalCount,
      windowMs,
    };
  });
}

export function createRateRouter(): Router {
  const router = Router();

  router.get("/rates", (req: Request, res: Response) => {
    const windowMs = req.query.windowMs
      ? parseInt(req.query.windowMs as string, 10)
      : 60_000;

    if (isNaN(windowMs) || windowMs <= 0) {
      res.status(400).json({ error: "Invalid windowMs parameter" });
      return;
    }

    const records = getRecords();
    const rates = computeRates(records, windowMs);
    res.json({ windowMs, rates });
  });

  return router;
}
