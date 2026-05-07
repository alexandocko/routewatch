import { RouteRef } from './types';

export interface RouteNote {
  id: string;
  route: RouteRef;
  text: string;
  createdAt: number;
  updatedAt: number;
}

let notes: RouteNote[] = [];
let nextId = 1;

export function addNote(route: RouteRef, text: string): RouteNote {
  const now = Date.now();
  const note: RouteNote = {
    id: String(nextId++),
    route,
    text,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  return note;
}

export function getNotes(): RouteNote[] {
  return [...notes];
}

export function getNotesByRoute(method: string, path: string): RouteNote[] {
  return notes.filter(
    (n) =>
      n.route.method.toUpperCase() === method.toUpperCase() &&
      n.route.path === path
  );
}

export function updateNote(id: string, text: string): RouteNote | null {
  const note = notes.find((n) => n.id === id);
  if (!note) return null;
  note.text = text;
  note.updatedAt = Date.now();
  return note;
}

export function deleteNote(id: string): boolean {
  const before = notes.length;
  notes = notes.filter((n) => n.id !== id);
  return notes.length < before;
}

export function clearNotes(): void {
  notes = [];
  nextId = 1;
}
