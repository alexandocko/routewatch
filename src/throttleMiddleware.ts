import { Request, Response, NextFunction } from "express";
import { getThrottleRules, evaluateThrottle } from "./throttle";
import { getRecords } from "./middleware";

/**
 * Express middleware that enforces throttle rules.
 * Responds with 429 if the request matches a throttled route.
 */
export function throttleMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const rules = getThrottleRules();
  if (rules.length === 0) {
    return next();
  }

  const records = getRecords();
  const violations = evaluateThrottle(records);

  const method = req.method.toUpperCase();
  const path = req.path;

  const violated = violations.find(
    (v) =>
      v.method.toUpperCase() === method &&
      v.route === path &&
      v.exceeded
  );

  if (violated) {
    res.status(429).json({
      error: "Too Many Requests",
      route: violated.route,
      method: violated.method,
      maxRpm: violated.maxRpm,
      currentRpm: violated.currentRpm,
    });
    return;
  }

  next();
}
