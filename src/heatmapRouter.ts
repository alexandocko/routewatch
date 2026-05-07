import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { computeHeatmap } from "./heatmap";

/**
 * Creates a router that exposes heatmap data for API routes.
 *
 * GET /heatmap        - returns heatmap data (hits by route x hour-of-day)
 * GET /heatmap/:route - returns heatmap data filtered to a specific route
 */
export function createHeatmapRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const records = getRecords();
    const heatmap = computeHeatmap(records);
    res.json({ heatmap });
  });

  router.get("/:route(*)", (req: Request, res: Response) => {
    const routeParam = "/" + req.params.route;
    const records = getRecords().filter((r) => r.route === routeParam);

    if (records.length === 0) {
      res.status(404).json({ error: `No records found for route: ${routeParam}` });
      return;
    }

    const heatmap = computeHeatmap(records);
    res.json({ route: routeParam, heatmap });
  });

  return router;
}
