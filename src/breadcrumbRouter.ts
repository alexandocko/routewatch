import { Router, Request, Response } from "express";
import {
  recordBreadcrumb,
  getBreadcrumbBySession,
  listBreadcrumbs,
  deleteBreadcrumb,
  clearBreadcrumbs,
} from "./breadcrumb";

export function createBreadcrumbRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const all = listBreadcrumbs();
    res.json({ breadcrumbs: all, total: all.length });
  });

  router.get("/session/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const crumbs = getBreadcrumbBySession(sessionId);
    if (!crumbs || crumbs.length === 0) {
      return res.status(404).json({ error: "No breadcrumbs found for session" });
    }
    res.json({ sessionId, breadcrumbs: crumbs });
  });

  router.post("/", (req: Request, res: Response) => {
    const { sessionId, method, path, statusCode, duration, meta } = req.body;
    if (!sessionId || !method || !path) {
      return res.status(400).json({ error: "sessionId, method, and path are required" });
    }
    const entry = recordBreadcrumb({ sessionId, method, path, statusCode, duration, meta });
    res.status(201).json({ breadcrumb: entry });
  });

  router.delete("/session/:sessionId", (req: Request, res: Response) => {
    const { sessionId } = req.params;
    deleteBreadcrumb(sessionId);
    res.json({ message: `Breadcrumbs for session '${sessionId}' cleared` });
  });

  router.delete("/", (_req: Request, res: Response) => {
    clearBreadcrumbs();
    res.json({ message: "All breadcrumbs cleared" });
  });

  return router;
}
