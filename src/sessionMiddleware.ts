import { Request, Response, NextFunction } from 'express';
import { recordSession } from './session';

export const SESSION_HEADER = 'x-session-id';

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.headers[SESSION_HEADER] as string | undefined;
  if (!sessionId) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    recordSession(sessionId, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      timestamp: start,
    });
  });

  next();
}
