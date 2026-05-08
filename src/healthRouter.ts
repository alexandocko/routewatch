import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { getSlowlogStats } from "./slowlog";
import { getErrorSummary } from "./errorTracker";
import { getRetentionStats } from "./retention";

export interface HealthStatus {
  status: "ok" | "degraded" | "critical";
  uptime: number;
  totalRequests: number;
  errorRate: number;
  slowRequestRate: number;
  memoryUsageMb: number;
  checkedAt: string;
}

const startTime = Date.now();

export function computeHealth(): HealthStatus {
  const records = getRecords();
  const total = records.length;

  const errorSummary = getErrorSummary();
  const errorCount = Object.values(errorSummary).reduce((sum, n) => sum + n, 0);
  const errorRate = total > 0 ? errorCount / total : 0;

  const slowStats = getSlowlogStats();
  const slowRate = total > 0 ? slowStats.count / total : 0;

  const memMb = process.memoryUsage().heapUsed / 1024 / 1024;

  let status: HealthStatus["status"] = "ok";
  if (errorRate > 0.25 || slowRate > 0.5) {
    status = "critical";
  } else if (errorRate > 0.1 || slowRate > 0.2) {
    status = "degraded";
  }

  return {
    status,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    totalRequests: total,
    errorRate: parseFloat(errorRate.toFixed(4)),
    slowRequestRate: parseFloat(slowRate.toFixed(4)),
    memoryUsageMb: parseFloat(memMb.toFixed(2)),
    checkedAt: new Date().toISOString(),
  };
}

export function createHealthRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const health = computeHealth();
    const httpStatus = health.status === "critical" ? 503 : 200;
    res.status(httpStatus).json(health);
  });

  router.get("/retention", (_req: Request, res: Response) => {
    const stats = getRetentionStats(getRecords());
    res.json(stats);
  });

  return router;
}
