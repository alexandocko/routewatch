import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { RouteRecord } from "./types";

export interface CorrelationPair {
  routeA: string;
  routeB: string;
  coOccurrences: number;
  avgTimeDeltaMs: number;
}

export function computeCorrelations(
  records: RouteRecord[],
  windowMs = 5000
): CorrelationPair[] {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const pairCounts: Record<string, { count: number; totalDelta: number }> = {};

  for (let i = 0; i < sorted.length; i++) {
    const base = sorted[i];
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];
      const delta = next.timestamp - base.timestamp;
      if (delta > windowMs) break;

      const key = [base.route, next.route].sort().join(" <-> ");
      if (!pairCounts[key]) {
        pairCounts[key] = { count: 0, totalDelta: 0 };
      }
      pairCounts[key].count += 1;
      pairCounts[key].totalDelta += delta;
    }
  }

  return Object.entries(pairCounts)
    .map(([key, { count, totalDelta }]) => {
      const [routeA, routeB] = key.split(" <-> ");
      return {
        routeA,
        routeB,
        coOccurrences: count,
        avgTimeDeltaMs: Math.round(totalDelta / count),
      };
    })
    .sort((a, b) => b.coOccurrences - a.coOccurrences);
}

export function createCorrelationRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const windowMs = 5000;
    const records = getRecords();
    const correlations = computeCorrelations(records, windowMs);
    res.json({
      windowMs,
      totalRecords: records.length,
      correlations,
    });
  });

  router.get("/route", (req: Request, res: Response) => {
    const { name } = req.query as { name?: string };
    if (!name) {
      res.status(400).json({ error: "Missing query param: name" });
      return;
    }
    const records = getRecords();
    const all = computeCorrelations(records);
    const filtered = all.filter(
      (p) => p.routeA === name || p.routeB === name
    );
    res.json({ route: name, correlations: filtered });
  });

  return router;
}
