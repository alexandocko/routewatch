import {
  addNote,
  getNotes,
  getNotesByRoute,
  updateNote,
  deleteNote,
  clearNotes,
} from './note';
import { RouteRef } from './types';

function makeRouteRef(method = 'GET', path = '/api/test'): RouteRef {
  return { method, path };
}

beforeEach(() => {
  clearNotes();
});

describe('addNote', () => {
  it('creates a note with the given route and text', () => {
    const note = addNote(makeRouteRef(), 'This endpoint is slow');
    expect(note.text).toBe('This endpoint is slow');
    expect(note.route.method).toBe('GET');
    expect(note.route.path).toBe('/api/test');
    expect(note.id).toBeDefined();
    expect(note.createdAt).toBeGreaterThan(0);
    expect(note.updatedAt).toBe(note.createdAt);
  });

  it('assigns unique ids to each note', () => {
    const a = addNote(makeRouteRef(), 'first');
    const b = addNote(makeRouteRef(), 'second');
    expect(a.id).not.toBe(b.id);
  });
});

describe('getNotes', () => {
  it('returns all notes', () => {
    addNote(makeRouteRef(), 'note 1');
    addNote(makeRouteRef('POST', '/api/other'), 'note 2');
    expect(getNotes()).toHaveLength(2);
  });

  it('returns empty array when no notes exist', () => {
    expect(getNotes()).toEqual([]);
  });
});

describe('getNotesByRoute', () => {
  it('returns only notes matching the given method and path', () => {
    addNote(makeRouteRef('GET', '/api/foo'), 'foo note');
    addNote(makeRouteRef('POST', '/api/foo'), 'post note');
    addNote(makeRouteRef('GET', '/api/bar'), 'bar note');
    const results = getNotesByRoute('GET', '/api/foo');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('foo note');
  });

  it('is case-insensitive for method', () => {
    addNote(makeRouteRef('GET', '/api/foo'), 'foo note');
    expect(getNotesByRoute('get', '/api/foo')).toHaveLength(1);
  });
});

describe('updateNote', () => {
  it('updates the text and updatedAt of an existing note', () => {
    const note = addNote(makeRouteRef(), 'original');
    const updated = updateNote(note.id, 'revised');
    expect(updated).not.toBeNull();
    expect(updated!.text).toBe('revised');
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(note.createdAt);
  });

  it('returns null for a non-existent id', () => {
    expect(updateNote('999', 'text')).toBeNull();
  });
});

describe('deleteNote', () => {
  it('removes a note by id and returns true', () => {
    const note = addNote(makeRouteRef(), 'to delete');
    expect(deleteNote(note.id)).toBe(true);
    expect(getNotes()).toHaveLength(0);
  });

  it('returns false when note does not exist', () => {
    expect(deleteNote('nonexistent')).toBe(false);
  });
});

describe('clearNotes', () => {
  it('removes all notes', () => {
    addNote(makeRouteRef(), 'a');
    addNote(makeRouteRef(), 'b');
    clearNotes();
    expect(getNotes()).toHaveLength(0);
  });
});
