import { Router } from 'express';
import { getErrorEntries, getErrorSummary, clearErrorLog } from './errorTracker';

export function createErrorRouter(): Router {
  const router = Router();

  router.get('/errors', (_req, res) => {
    const entries = getErrorEntries();
    res.json({ count: entries.length, entries });
  });

  router.get('/errors/summary', (_req, res) => {
    res.json(getErrorSummary());
  });

  router.delete('/errors', (_req, res) => {
    clearErrorLog();
    res.json({ message: 'Error log cleared.' });
  });

  return router;
}
