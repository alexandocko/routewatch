import { Router, Request, Response } from "express";
import {
  addNote,
  getNotes,
  getNotesByRoute,
  updateNote,
  deleteNote,
  clearNotes,
} from "./note";

export function createNoteRouter(): Router {
  const router = Router();

  // GET /notes — list all notes
  router.get("/", (_req: Request, res: Response) => {
    res.json(getNotes());
  });

  // GET /notes/route?method=GET&path=/api/foo — notes for a specific route
  router.get("/route", (req: Request, res: Response) => {
    const method = (req.query.method as string | undefined)?.toUpperCase();
    const path = req.query.path as string | undefined;

    if (!method || !path) {
      res.status(400).json({ error: "method and path query params are required" });
      return;
    }

    res.json(getNotesByRoute({ method, path }));
  });

  // POST /notes — add a new note
  router.post("/", (req: Request, res: Response) => {
    const { route, text } = req.body ?? {};

    if (!route?.method || !route?.path || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "route (method, path) and text are required" });
      return;
    }

    const note = addNote(
      { method: (route.method as string).toUpperCase(), path: route.path as string },
      text.trim()
    );
    res.status(201).json(note);
  });

  // PATCH /notes/:id — update note text
  router.patch("/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const { text } = req.body ?? {};

    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const updated = updateNote(id, text.trim());
    if (!updated) {
      res.status(404).json({ error: "note not found" });
      return;
    }

    res.json(updated);
  });

  // DELETE /notes/:id — delete a single note
  router.delete("/:id", (req: Request, res: Response) => {
    const removed = deleteNote(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "note not found" });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  });

  // DELETE /notes — clear all notes
  router.delete("/", (_req: Request, res: Response) => {
    clearNotes();
    res.json({ cleared: true });
  });

  return router;
}
