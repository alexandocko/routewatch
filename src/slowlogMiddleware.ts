import { Request, Response, NextFunction } from 'express';
import { recordSlowlog, SlowlogOptions } from './slowlog';
import { RouteRecord } from './types';

/**
 * Express middleware that automatically records slow requests into the slowlog.
 * Attach this after routewatch() so that route records are available,
 * or use standalone by reconstructing the record from res.locals.
 */
export function slowlogMiddleware(options: SlowlogOptions = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const record: RouteRecord = {
        method: req.method,
        path: req.route?.path ?? req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: start,
        tags: [],
      };
      recordSlowlog(record, options);
    });

    next();
  };
}
