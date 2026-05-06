import { Router, Request, Response } from 'express';
import { getSlowlogEntries, clearSlowlog, getSlowlogStats, SlowlogOptions } from './slowlog';

export function createSlowlogRouter(options: SlowlogOptions = {}): Router {
  const router = Router();

  // GET /slowlog — list slow requests
  router.get('/', (_req: Request, res: Response) => {
    const entries = getSlowlogEntries();
    const stats = getSlowlogStats(entries);
    res.json({
      threshold: options.threshold ?? 500,
      stats,
      entries,
    });
  });

  // GET /slowlog/stats — summary stats only
  router.get('/stats', (_req: Request, res: Response) => {
    const entries = getSlowlogEntries();
    const stats = getSlowlogStats(entries);
    res.json(stats);
  });

  // DELETE /slowlog — clear slow log
  router.delete('/', (_req: Request, res: Response) => {
    clearSlowlog();
    res.json({ cleared: true });
  });

  return router;
}
