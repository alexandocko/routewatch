import { Router, Request, Response } from "express";
import { getRecords } from "./middleware";
import { computeDependencies } from "./dependency";

export function createDependencyRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const records = getRecords();
    const deps = computeDependencies(records);
    res.json(deps);
  });

  router.get("/:route", (req: Request, res: Response) => {
    const { route } = req.params;
    const decoded = decodeURIComponent(route);
    const records = getRecords();
    const deps = computeDependencies(records);

    const entry = deps.find((d) => d.route === decoded);
    if (!entry) {
      return res.status(404).json({ error: `No dependency data for route: ${decoded}` });
    }

    return res.json(entry);
  });

  router.get("/:route/callers", (req: Request, res: Response) => {
    const { route } = req.params;
    const decoded = decodeURIComponent(route);
    const records = getRecords();
    const deps = computeDependencies(records);

    const callers = deps
      .filter((d) => d.dependsOn.includes(decoded))
      .map((d) => d.route);

    return res.json({ route: decoded, callers });
  });

  return router;
}
