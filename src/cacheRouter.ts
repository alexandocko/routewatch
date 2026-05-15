import { Router, Request, Response } from "express";
import {
  getCacheEvents,
  clearCacheEvents,
  computeCacheStats,
  getCacheStatsByRoute,
} from "./cache";

export function createCacheRouter(): Router {
  const router = Router();

  // GET /cache/events - list all cache events
  router.get("/events", (_req: Request, res: Response) => {
    const events = getCacheEvents();
    res.json({ events, total: events.length });
  });

  // GET /cache/stats - aggregate cache stats
  router.get("/stats", (_req: Request, res: Response) => {
    const stats = computeCacheStats();
    res.json(stats);
  });

  // GET /cache/stats/:route - stats for a specific route
  router.get("/stats/:route(*)", (req: Request, res: Response) => {
    const route = decodeURIComponent(req.params.route);
    const stats = getCacheStatsByRoute(route);
    if (!stats) {
      return res.status(404).json({ error: "No cache data found for route" });
    }
    res.json(stats);
  });

  // DELETE /cache/events - clear all cache events
  router.delete("/events", (_req: Request, res: Response) => {
    clearCacheEvents();
    res.json({ message: "Cache events cleared" });
  });

  return router;
}
