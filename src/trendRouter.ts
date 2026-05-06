import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { computeTrends } from './trend';

/**
 * Creates an Express router that exposes trend data for recorded routes.
 *
 * GET /trends              - returns trends for all routes
 * GET /trends/:method/:route - returns trend for a specific method+route
 *
 * Query params:
 *   bucketMs (number) - size of each time bucket in ms (default 60000)
 */
export function createTrendRouter(): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const bucketMs = req.query.bucketMs ? Number(req.query.bucketMs) : 60_000;
    if (isNaN(bucketMs) || bucketMs <= 0) {
      return res.status(400).json({ error: 'bucketMs must be a positive number' });
    }
    const records = getRecords();
    const trends = computeTrends(records, bucketMs);
    res.json(trends);
  });

  router.get('/:method/:route(*)', (req: Request, res: Response) => {
    const { method, route } = req.params;
    const bucketMs = req.query.bucketMs ? Number(req.query.bucketMs) : 60_000;
    if (isNaN(bucketMs) || bucketMs <= 0) {
      return res.status(400).json({ error: 'bucketMs must be a positive number' });
    }
    const records = getRecords();
    const trends = computeTrends(records, bucketMs);
    const match = trends.find(
      (t) =>
        t.method.toUpperCase() === method.toUpperCase() &&
        t.route === `/${route}`
    );
    if (!match) {
      return res.status(404).json({ error: 'No trend data found for that route' });
    }
    res.json(match);
  });

  return router;
}
