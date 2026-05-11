import { Router, Request, Response } from "express";
import {
  getMaskConfig,
  setMaskConfig,
  resetMaskConfig,
  maskObject,
} from "./fieldMask";

export function createFieldMaskRouter(): Router {
  const router = Router();

  // GET /fieldmask/config — return current mask config
  router.get("/config", (_req: Request, res: Response) => {
    const config = getMaskConfig();
    res.json(config);
  });

  // PUT /fieldmask/config — update mask config
  router.put("/config", (req: Request, res: Response) => {
    const { fields, replacement, enabled } = req.body ?? {};

    if (fields !== undefined && !Array.isArray(fields)) {
      res.status(400).json({ error: "fields must be an array of strings" });
      return;
    }

    if (replacement !== undefined && typeof replacement !== "string") {
      res.status(400).json({ error: "replacement must be a string" });
      return;
    }

    if (enabled !== undefined && typeof enabled !== "boolean") {
      res.status(400).json({ error: "enabled must be a boolean" });
      return;
    }

    setMaskConfig({ fields, replacement, enabled });
    res.json(getMaskConfig());
  });

  // POST /fieldmask/reset — reset config to defaults
  router.post("/reset", (_req: Request, res: Response) => {
    resetMaskConfig();
    res.json({ ok: true, config: getMaskConfig() });
  });

  // POST /fieldmask/preview — preview masking an arbitrary object
  router.post("/preview", (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      res.status(400).json({ error: "body must be a plain object" });
      return;
    }
    const masked = maskObject(body);
    res.json({ original: body, masked });
  });

  return router;
}
