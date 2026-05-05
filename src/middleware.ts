import { Request, Response, NextFunction } from 'express';

export interface RouteRecord {
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: Date;
}

export interface RouteWatchOptions {
  /** Log to console on each request. Default: true */
  verbose?: boolean;
  /** Custom logger function */
  logger?: (record: RouteRecord) => void;
}

const records: RouteRecord[] = [];

export function getRecords(): RouteRecord[] {
  return [...records];
}

export function clearRecords(): void {
  records.length = 0;
}

export function routewatch(options: RouteWatchOptions = {}) {
  const { verbose = true, logger } = options;

  return function routewatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const start = Date.now();

    res.on('finish', () => {
      const record: RouteRecord = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTimeMs: Date.now() - start,
        timestamp: new Date(),
      };

      records.push(record);

      if (logger) {
        logger(record);
      } else if (verbose) {
        const statusColor =
          record.statusCode >= 500
            ? '\x1b[31m'
            : record.statusCode >= 400
            ? '\x1b[33m'
            : '\x1b[32m';
        const reset = '\x1b[0m';
        console.log(
          `[routewatch] ${statusColor}${record.statusCode}${reset} ` +
            `${record.method.padEnd(6)} ${record.path} ` +
            `— ${record.responseTimeMs}ms`
        );
      }
    });

    next();
  };
}
