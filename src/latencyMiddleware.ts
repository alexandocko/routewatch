import { Request, Response, NextFunction } from 'express';
import { recordPayload } from './payload';

export interface LatencyThreshold {
  warn: number;  // ms
  error: number; // ms
}

const defaultThresholds: LatencyThreshold = {
  warn: 500,
  error: 2000,
};

let thresholds: LatencyThreshold = { ...defaultThresholds };

export function setLatencyThresholds(t: Partial<LatencyThreshold>): void {
  thresholds = { ...thresholds, ...t };
}

export function getLatencyThresholds(): LatencyThreshold {
  return { ...thresholds };
}

export function resetLatencyThresholds(): void {
  thresholds = { ...defaultThresholds };
}

/**
 * Middleware that adds an X-Response-Time header and emits a console warning
 * when response latency exceeds configured thresholds.
 */
export function latencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);

    if (duration >= thresholds.error) {
      console.error(
        `[routewatch] latency ERROR ${req.method} ${
          req.path
        } took ${duration}ms (threshold: ${thresholds.error}ms)`
      );
    } else if (duration >= thresholds.warn) {
      console.warn(
        `[routewatch] latency WARN ${req.method} ${
          req.path
        } took ${duration}ms (threshold: ${thresholds.warn}ms)`
      );
    }
  });

  next();
}
