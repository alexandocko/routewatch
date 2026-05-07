import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { detectAnomalies } from './anomaly';

export function createAnomalyRouter(): Router {
  const router = Router();

  /**
   * GET /anomalies
   * Query params:
   *   - multiplier: number (default 2.5) — stddev multiplier for threshold
   *   - flaggedOnly: boolean string — if "true", return only flagged routes
   */
  router.get('/', (req: Request, res: Response) => {
    const multiplier = req.query.multiplier
      ? parseFloat(req.query.multiplier as string)
      : 2.5;

    if (isNaN(multiplier) || multiplier <= 0) {
      res.status(400).json({ error: 'multiplier must be a positive number' });
      return;
    }

    const flaggedOnly = req.query.flaggedOnly === 'true';
    const records = getRecords();
    let results = detectAnomalies(records, multiplier);

    if (flaggedOnly) {
      results = results.filter((r) => r.flagged);
    }

    res.json({
      total: results.length,
      flagged: results.filter((r) => r.flagged).length,
      multiplier,
      anomalies: results,
    });
  });

  return router;
}
