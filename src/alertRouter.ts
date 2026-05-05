import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { evaluateAlerts, AlertRule } from './alert';

/**
 * Creates an Express router that exposes a POST /check endpoint.
 * Accepts an array of AlertRule objects in the request body and
 * returns evaluation results against the current route records.
 *
 * Usage:
 *   app.use('/__routewatch/alerts', createAlertRouter());
 */
export function createAlertRouter(
  defaultRules: AlertRule[] = []
): Router {
  const router = Router();

  // GET /rules — return the default rules configured at startup
  router.get('/rules', (_req: Request, res: Response) => {
    res.json({ rules: defaultRules });
  });

  // POST /check — evaluate supplied (or default) rules against live records
  router.post('/check', (req: Request, res: Response) => {
    const body = req.body as { rules?: AlertRule[] };
    const rules: AlertRule[] =
      Array.isArray(body?.rules) && body.rules.length > 0
        ? body.rules
        : defaultRules;

    if (rules.length === 0) {
      res.status(400).json({
        error: 'No alert rules provided. Pass rules in the request body or configure defaults.',
      });
      return;
    }

    const records = getRecords();
    const results = evaluateAlerts(records, rules);
    const triggered = results.filter((r) => r.triggered);

    res.json({
      checkedAt: new Date().toISOString(),
      totalRecords: records.length,
      rulesEvaluated: rules.length,
      triggeredCount: triggered.length,
      results,
    });
  });

  return router;
}
