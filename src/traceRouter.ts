import { Router, Request, Response } from 'express';
import {
  getAllTraces,
  getTraceById,
  listTraceIds,
  clearTraces,
  getTraceStats,
} from './trace';

export function createTraceRouter(): Router {
  const router = Router();

  // List all trace IDs
  router.get('/traces', (_req: Request, res: Response) => {
    const ids = listTraceIds();
    res.json({ traceIds: ids, count: ids.length });
  });

  // Get all trace entries (optionally filtered by traceId query param)
  router.get('/traces/entries', (req: Request, res: Response) => {
    const { traceId } = req.query;
    const entries = traceId
      ? getTraceById(String(traceId))
      : getAllTraces();
    res.json({ entries, count: entries.length });
  });

  // Get a specific trace by ID with stats
  router.get('/traces/:traceId', (req: Request, res: Response) => {
    const { traceId } = req.params;
    const entries = getTraceById(traceId);
    if (entries.length === 0) {
      res.status(404).json({ error: `No trace found for id: ${traceId}` });
      return;
    }
    const stats = getTraceStats(traceId);
    res.json({ traceId, entries, stats });
  });

  // Get stats only for a trace
  router.get('/traces/:traceId/stats', (req: Request, res: Response) => {
    const { traceId } = req.params;
    const entries = getTraceById(traceId);
    if (entries.length === 0) {
      res.status(404).json({ error: `No trace found for id: ${traceId}` });
      return;
    }
    res.json(getTraceStats(traceId));
  });

  // Clear all traces
  router.delete('/traces', (_req: Request, res: Response) => {
    clearTraces();
    res.json({ message: 'Traces cleared' });
  });

  return router;
}
