import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { compareWindows } from './compare';

export function createCompareRouter(): Router {
  const router = Router();

  /**
   * GET /compare?sinceA=<ms>&sinceB=<ms>&windowMs=<ms>
   * Compares two time windows of recorded requests.
   * Defaults: windowA = [now-2*windowMs, now-windowMs], windowB = [now-windowMs, now]
   */
  router.get('/', (req: Request, res: Response) => {
    const now = Date.now();
    const windowMs = parseInt(req.query.windowMs as string) || 60_000;

    const sinceA = parseInt(req.query.sinceA as string) || now - windowMs * 2;
    const sinceB = parseInt(req.query.sinceB as string) || now - windowMs;

    const labelA = (req.query.labelA as string) || 'Window A';
    const labelB = (req.query.labelB as string) || 'Window B';

    const all = getRecords();

    const recordsA = all.filter(r => r.timestamp >= sinceA && r.timestamp < sinceB);
    const recordsB = all.filter(r => r.timestamp >= sinceB && r.timestamp <= now);

    const result = compareWindows(
      { label: labelA, records: recordsA },
      { label: labelB, records: recordsB }
    );

    res.json(result);
  });

  return router;
}
