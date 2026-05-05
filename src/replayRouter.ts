import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { replayRequest, getReplayHistory, clearReplayHistory } from './replay';

export interface ReplayRouterOptions {
  baseUrl?: string;
}

export function createReplayRouter(options: ReplayRouterOptions = {}): Router {
  const router = Router();
  const baseUrl = options.baseUrl ?? 'http://localhost:3000';

  // GET /replay — list replay history
  router.get('/', (_req: Request, res: Response) => {
    res.json(getReplayHistory());
  });

  // DELETE /replay — clear replay history
  router.delete('/', (_req: Request, res: Response) => {
    clearReplayHistory();
    res.json({ cleared: true });
  });

  // POST /replay/:index — replay a recorded request by index
  router.post('/:index', async (req: Request, res: Response) => {
    const index = parseInt(req.params.index, 10);
    const records = getRecords();

    if (isNaN(index) || index < 0 || index >= records.length) {
      return res.status(404).json({ error: 'Record not found at given index' });
    }

    try {
      const entry = await replayRequest(records[index], baseUrl);
      return res.status(200).json(entry);
    } catch (err) {
      return res.status(500).json({ error: 'Replay failed', detail: String(err) });
    }
  });

  return router;
}
