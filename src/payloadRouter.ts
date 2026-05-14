import { Router, Request, Response } from 'express';
import {
  computePayloadStats,
  getPayloadEntries,
  clearPayloadEntries,
} from './payload';

export function createPayloadRouter(): Router {
  const router = Router();

  // GET /payload/stats — aggregated stats per route+method
  router.get('/stats', (_req: Request, res: Response) => {
    const stats = computePayloadStats();
    res.json({ stats });
  });

  // GET /payload/entries — raw payload entries
  router.get('/entries', (req: Request, res: Response) => {
    const entries = getPayloadEntries();
    const route = req.query.route as string | undefined;
    const method = req.query.method as string | undefined;

    const filtered = entries.filter((e) => {
      if (route && e.route !== route) return false;
      if (method && e.method !== method.toUpperCase()) return false;
      return true;
    });

    res.json({ count: filtered.length, entries: filtered });
  });

  // GET /payload/top — top N routes by response size
  router.get('/top', (req: Request, res: Response) => {
    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 100);
    const stats = computePayloadStats().slice(0, limit);
    res.json({ limit, stats });
  });

  // DELETE /payload — clear all payload entries
  router.delete('/', (_req: Request, res: Response) => {
    clearPayloadEntries();
    res.json({ cleared: true });
  });

  return router;
}
