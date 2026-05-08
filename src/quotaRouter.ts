import { Router, Request, Response } from "express";
import {
  addQuotaRule,
  clearQuotaRules,
  evaluateQuotas,
  getQuotaRules,
  removeQuotaRule,
} from "./quota";
import { getRecords } from "./middleware";

export function createQuotaRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json(getQuotaRules());
  });

  router.post("/", (req: Request, res: Response) => {
    const { route, method, maxRequests, windowMs } = req.body;
    if (!route || maxRequests == null || windowMs == null) {
      res.status(400).json({ error: "route, maxRequests, and windowMs are required" });
      return;
    }
    addQuotaRule({ route, method, maxRequests: Number(maxRequests), windowMs: Number(windowMs) });
    res.status(201).json({ ok: true });
  });

  router.delete("/", (_req: Request, res: Response) => {
    clearQuotaRules();
    res.json({ ok: true });
  });

  router.delete("/:route", (req: Request, res: Response) => {
    const route = decodeURIComponent(req.params.route);
    const { method } = req.query as { method?: string };
    removeQuotaRule(route, method);
    res.json({ ok: true });
  });

  router.get("/status", (_req: Request, res: Response) => {
    const records = getRecords();
    const statuses = evaluateQuotas(records);
    res.json(statuses);
  });

  return router;
}
