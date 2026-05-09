import { Router } from 'express';
import {
  listSessions,
  getSession,
  summarizeSession,
  deleteSession,
  clearSessions,
} from './session';

export function createSessionRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const ids = listSessions();
    const summaries = ids.map(id => summarizeSession(id)).filter(Boolean);
    res.json({ sessions: summaries, total: summaries.length });
  });

  router.get('/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const summary = summarizeSession(sessionId);
    if (!summary) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(summary);
  });

  router.get('/:sessionId/records', (req, res) => {
    const { sessionId } = req.params;
    const records = getSession(sessionId);
    if (records.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ sessionId, records, count: records.length });
  });

  router.delete('/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const deleted = deleteSession(sessionId);
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ deleted: true, sessionId });
  });

  router.delete('/', (_req, res) => {
    clearSessions();
    res.json({ cleared: true });
  });

  return router;
}
