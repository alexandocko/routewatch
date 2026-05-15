import { Request, Response, NextFunction } from "express";
import { recordCacheEvent } from "./cache";

/**
 * Express middleware that instruments responses with an X-Cache header.
 * Downstream handlers should set `res.locals.cacheHit = true | false`
 * before sending a response. The middleware records the outcome.
 */
export function cacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const hit: boolean =
      res.locals.cacheHit === true ||
      res.getHeader("X-Cache") === "HIT";

    const route: string =
      (req.route?.path as string) ||
      req.path ||
      req.url;

    const durationMs = Date.now() - start;

    recordCacheEvent({
      route,
      hit,
      durationMs,
      timestamp: start,
    });
  });

  next();
}
