import { Router, Request, Response } from "express";
import {
  addThrottleRule,
  removeThrottleRule,
  getThrottleRules,
  clearThrottleRules,
  evaluateThrottle,
} from "./throttle";
import { getRecords } from "./middleware";

export function createThrottleRouter(): Router {
  const router = Router();

  router.get("/rules", (_req: Request, res: Response) => {
    res.json(getThrottleRules());
  });

  router.post("/rules", (req: Request, res: Response) => {
    const { route, method, maxRpm, windowMs } = req.body;
    if (!route || !method || typeof maxRpm !== "number") {
      return res.status(400).json({ error: "route, method, and maxRpm are required" });
    }
    const rule = addThrottleRule({ route, method, maxRpm, windowMs });
    res.status(201).json(rule);
  });

  router.delete("/rules/:id", (req: Request, res: Response) => {
    const removed = removeThrottleRule(req.params.id);
    if (!removed) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true });
  });

  router.delete("/rules", (_req: Request, res: Response) => {
    clearThrottleRules();
    res.json({ success: true });
  });

  router.get("/evaluate", (_req: Request, res: Response) => {
    const records = getRecords();
    const results = evaluateThrottle(records);
    res.json(results);
  });

  return router;
}
