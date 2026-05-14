import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import {
  addCircuitRule,
  clearCircuitRules,
  evaluateCircuits,
  getCircuitRules,
  removeCircuitRule,
} from './circuit';

export function createCircuitRouter(): Router {
  const router = Router();

  // GET /circuit/rules — list all rules
  router.get('/rules', (_req: Request, res: Response) => {
    res.json(getCircuitRules());
  });

  // POST /circuit/rules — add a rule
  router.post('/rules', (req: Request, res: Response) => {
    const { id, route, method, errorThreshold, windowMs, tripDurationMs } = req.body;
    if (!id || !route || !method || errorThreshold == null || !windowMs || !tripDurationMs) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const rule = addCircuitRule({ id, route, method, errorThreshold, windowMs, tripDurationMs });
    res.status(201).json(rule);
  });

  // DELETE /circuit/rules/:id — remove a rule
  router.delete('/rules/:id', (req: Request, res: Response) => {
    const removed = removeCircuitRule(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Rule not found' });
    res.json({ removed: true });
  });

  // DELETE /circuit/rules — clear all rules
  router.delete('/rules', (_req: Request, res: Response) => {
    clearCircuitRules();
    res.json({ cleared: true });
  });

  // GET /circuit/status — evaluate circuits against current records
  router.get('/status', (_req: Request, res: Response) => {
    const records = getRecords();
    const statuses = evaluateCircuits(records);
    res.json(statuses);
  });

  return router;
}
