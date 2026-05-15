import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { computeLatency } from './latency';
import { filterRecords } from './filter';

export function createLatencyRouter(): Router {
  const router = Router();

  // GET /latency — full latency stats with optional filtering
  router.get('/', (req: Request, res: Response) => {
    const records = getRecords();
    const { method, route, since, until } = req.query as Record<string, string>;

    const filtered = filterRecords(records, {
      method: method?.toUpperCase(),
      route,
      since: since ? Number(since) : undefined,
      until: until ? Number(until) : undefined,
    });

    const stats = computeLatency(filtered);
    res.json(stats);
  });

  // GET /latency/:route — latency for a specific route (all methods)
  router.get('/route/:route(*)', (req: Request, res: Response) => {
    const records = getRecords();
    const targetRoute = '/' + req.params['route'];

    const filtered = records.filter((r) => r.route === targetRoute);
    if (filtered.length === 0) {
      return res.status(404).json({ error: 'Route not found in records' });
    }

    const stats = computeLatency(filtered);
    res.json(stats);
  });

  // GET /latency/summary — just the overall stats
  router.get('/summary', (_req: Request, res: Response) => {
    const records = getRecords();
    const { overall } = computeLatency(records);
    res.json(overall);
  });

  return router;
}
