import { Router, Request, Response } from 'express';
import {
  addBookmark,
  getBookmarks,
  getBookmarkById,
  removeBookmark,
  clearBookmarks,
  findBookmarksByRoute,
} from './bookmark';

export function createBookmarkRouter(): Router {
  const router = Router();

  // GET /bookmarks — list all bookmarks (optionally filter by route/method)
  router.get('/', (req: Request, res: Response) => {
    const { route, method } = req.query as Record<string, string>;
    if (route) {
      return res.json(findBookmarksByRoute(route, method));
    }
    res.json(getBookmarks());
  });

  // POST /bookmarks — create a new bookmark
  router.post('/', (req: Request, res: Response) => {
    const { route, method, label, notes } = req.body ?? {};
    if (!route || !method || !label) {
      return res.status(400).json({ error: 'route, method, and label are required' });
    }
    const bm = addBookmark({ route, method }, label, notes);
    res.status(201).json(bm);
  });

  // GET /bookmarks/:id — fetch a single bookmark
  router.get('/:id', (req: Request, res: Response) => {
    const bm = getBookmarkById(req.params.id);
    if (!bm) return res.status(404).json({ error: 'Bookmark not found' });
    res.json(bm);
  });

  // DELETE /bookmarks/:id — remove a bookmark
  router.delete('/:id', (req: Request, res: Response) => {
    const removed = removeBookmark(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Bookmark not found' });
    res.status(204).send();
  });

  // DELETE /bookmarks — clear all bookmarks
  router.delete('/', (_req: Request, res: Response) => {
    clearBookmarks();
    res.status(204).send();
  });

  return router;
}
