import { Router, Request, Response } from "express";
import {
  createPipeline,
  getPipeline,
  listPipelines,
  deletePipeline,
  runPipeline,
  PipelineStage,
} from "./pipeline";
import { getRecords } from "./middleware";

export function createPipelineRouter(): Router {
  const router = Router();

  // List all pipelines
  router.get("/", (_req: Request, res: Response) => {
    res.json(listPipelines().map(({ id, name, stages }) => ({
      id,
      name,
      stageCount: stages.length,
    })));
  });

  // Create a new pipeline (stages are name-only; transforms are built-ins)
  router.post("/", (req: Request, res: Response) => {
    const { name, stages } = req.body as { name?: string; stages?: { name: string; filter?: string }[] };
    if (!name || !Array.isArray(stages)) {
      return res.status(400).json({ error: "name and stages[] required" });
    }
    const builtStages: PipelineStage[] = stages.map((s) => ({
      name: s.name,
      transform: (records) => {
        if (s.filter === "errors") return records.filter((r) => r.status >= 400);
        if (s.filter === "slow") return records.filter((r) => r.duration > 500);
        if (s.filter === "success") return records.filter((r) => r.status < 400);
        return records;
      },
    }));
    const pipeline = createPipeline(name, builtStages);
    res.status(201).json({ id: pipeline.id, name: pipeline.name });
  });

  // Get a single pipeline
  router.get("/:id", (req: Request, res: Response) => {
    const pipeline = getPipeline(req.params.id);
    if (!pipeline) return res.status(404).json({ error: "Not found" });
    res.json({ id: pipeline.id, name: pipeline.name, stageCount: pipeline.stages.length });
  });

  // Run a pipeline against current records
  router.post("/:id/run", (req: Request, res: Response) => {
    const records = getRecords();
    const result = runPipeline(req.params.id, records);
    if (result === null) return res.status(404).json({ error: "Pipeline not found" });
    res.json({ count: result.length, records: result });
  });

  // Delete a pipeline
  router.delete("/:id", (req: Request, res: Response) => {
    const deleted = deletePipeline(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  });

  return router;
}
