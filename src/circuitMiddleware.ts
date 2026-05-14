import { Request, Response, NextFunction } from 'express';
import { getRecords } from './middleware';
import { evaluateCircuits } from './circuit';

/**
 * Express middleware that short-circuits requests to routes whose circuit
 * breaker is currently open, responding with 503 Service Unavailable.
 */
export function circuitMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const records = getRecords();
    const statuses = evaluateCircuits(records);

    const tripped = statuses.find(
      (s) =>
        s.rule.state === 'open' &&
        s.rule.method.toUpperCase() === req.method.toUpperCase() &&
        s.rule.route === req.path
    );

    if (tripped) {
      res.status(503).json({
        error: 'Circuit open',
        route: tripped.rule.route,
        method: tripped.rule.method,
        errorRate: tripped.errorRate,
        retryAfter: tripped.rule.openedAt
          ? Math.ceil(
              (tripped.rule.openedAt + tripped.rule.tripDurationMs - Date.now()) / 1000
            )
          : null,
      });
      return;
    }

    next();
  };
}
