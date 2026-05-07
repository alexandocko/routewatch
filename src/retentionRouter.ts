import { Router, Request, Response } from 'express';
import { getRecords, clearRecords } from './middleware';
import { applyRetention, getRetentionStats, RetentionOptions } from './retention';

const DEFAULT_OPTIONS: RetentionOptions = {
  maxRecords: 1000,
  maxAgeMs: 24 * 60 * 60 * 1000,
};

export function createRetentionRouter(options: RetentionOptions = DEFAULT_OPTIONS): Router {
  const router = Router();

  // GET /retention/stats — show how many records would be pruned
  router.get('/stats', (_req: Request, res: Response) => {
    const records = getRecords();
    const stats = getRetentionStats(records, options);
    res.json(stats);
  });

  // POST /retention/apply — prune records in-place and return stats
  router.post('/apply', (_req: Request, res: Response) => {
    const records = getRecords();
    const before = records.length;
    const retained = applyRetention(records, options);
    clearRecords();
    // Re-populate with retained records via internal mutation workaround
    (retained as any).forEach((r: any) => getRecords().push(r));
    res.json({
      before,
      after: retained.length,
      pruned: before - retained.length,
    });
  });

  // GET /retention/config — show current retention config
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      maxRecords: options.maxRecords ?? 1000,
      maxAgeMs: options.maxAgeMs ?? 24 * 60 * 60 * 1000,
    });
  });

  return router;
}
