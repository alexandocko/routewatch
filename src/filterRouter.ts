import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { filterRecords, FilterOptions } from './filter';

export function createFilterRouter(): Router {
  const router = Router();

  /**
   * GET /__routewatch/filter
   * Query params: method, path, statusCode, minDuration, maxDuration, since, until
   */
  router.get('/filter', (req: Request, res: Response) => {
    const options: FilterOptions = {};

    if (req.query.method) {
      const raw = req.query.method as string;
      options.method = raw.includes(',') ? raw.split(',') : raw;
    }

    if (req.query.path) {
      options.path = req.query.path as string;
    }

    if (req.query.statusCode) {
      const raw = req.query.statusCode as string;
      const codes = raw.split(',').map(Number).filter((n) => !isNaN(n));
      options.statusCode = codes.length === 1 ? codes[0] : codes;
    }

    if (req.query.minDuration) {
      const val = Number(req.query.minDuration);
      if (!isNaN(val)) options.minDuration = val;
    }

    if (req.query.maxDuration) {
      const val = Number(req.query.maxDuration);
      if (!isNaN(val)) options.maxDuration = val;
    }

    if (req.query.since) {
      const d = new Date(req.query.since as string);
      if (!isNaN(d.getTime())) options.since = d;
    }

    if (req.query.until) {
      const d = new Date(req.query.until as string);
      if (!isNaN(d.getTime())) options.until = d;
    }

    const records = getRecords();
    const filtered = filterRecords(records, options);

    res.json({
      total: records.length,
      matched: filtered.length,
      records: filtered,
    });
  });

  return router;
}
