import { Router, Request, Response } from 'express';
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getWatchlistEntry,
  clearWatchlist,
} from './watchlist';

export function createWatchlistRouter(): Router {
  const router = Router();

  // GET /watchlist — list all watched routes
  router.get('/', (_req: Request, res: Response) => {
    res.json(getWatchlist());
  });

  // POST /watchlist — add a route to the watchlist
  // body: { method, path, label? }
  router.post('/', (req: Request, res: Response) => {
    const { method, path: routePath, label } = req.body ?? {};
    if (!method || !routePath) {
      res.status(400).json({ error: 'method and path are required' });
      return;
    }
    const entry = addToWatchlist(method, routePath, label);
    res.status(201).json(entry);
  });

  // GET /watchlist/:method/:path — get a single entry
  router.get('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const routePath = '/' + (req.params as Record<string, string>)[0];
    const entry = getWatchlistEntry(method, routePath);
    if (!entry) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(entry);
  });

  // DELETE /watchlist/:method/:path — remove a route
  router.delete('/:method/*', (req: Request, res: Response) => {
    const method = req.params.method;
    const routePath = '/' + (req.params as Record<string, string>)[0];
    const removed = removeFromWatchlist(method, routePath);
    if (!removed) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).send();
  });

  // DELETE /watchlist — clear all
  router.delete('/', (_req: Request, res: Response) => {
    clearWatchlist();
    res.status(204).send();
  });

  return router;
}
