import { Router, Request, Response } from 'express';
import {
  addSchedule,
  getSchedule,
  listSchedules,
  deleteSchedule,
  clearSchedules,
  recordTrigger,
} from './schedule';

export function createScheduleRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(listSchedules());
  });

  router.post('/', (req: Request, res: Response) => {
    const { label, cronExpression, route, method } = req.body;
    if (!label || !cronExpression || !route || !method) {
      return res.status(400).json({ error: 'label, cronExpression, route, and method are required' });
    }
    const entry = addSchedule(label, cronExpression, route, method);
    res.status(201).json(entry);
  });

  router.get('/:id', (req: Request, res: Response) => {
    const entry = getSchedule(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Schedule not found' });
    res.json(entry);
  });

  router.post('/:id/trigger', (req: Request, res: Response) => {
    const entry = recordTrigger(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Schedule not found' });
    res.json(entry);
  });

  router.delete('/:id', (req: Request, res: Response) => {
    const removed = deleteSchedule(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ success: true });
  });

  router.delete('/', (_req: Request, res: Response) => {
    clearSchedules();
    res.json({ success: true });
  });

  return router;
}
