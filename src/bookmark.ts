import { RouteRecord } from './types';

export interface Bookmark {
  id: string;
  label: string;
  route: string;
  method: string;
  createdAt: number;
  notes?: string;
}

const bookmarks: Map<string, Bookmark> = new Map();

let counter = 0;

export function addBookmark(
  record: Pick<RouteRecord, 'route' | 'method'>,
  label: string,
  notes?: string
): Bookmark {
  const id = `bm_${++counter}_${Date.now()}`;
  const bookmark: Bookmark = {
    id,
    label,
    route: record.route,
    method: record.method,
    createdAt: Date.now(),
    notes,
  };
  bookmarks.set(id, bookmark);
  return bookmark;
}

export function getBookmarks(): Bookmark[] {
  return Array.from(bookmarks.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function getBookmarkById(id: string): Bookmark | undefined {
  return bookmarks.get(id);
}

export function removeBookmark(id: string): boolean {
  return bookmarks.delete(id);
}

export function clearBookmarks(): void {
  bookmarks.clear();
  counter = 0;
}

export function findBookmarksByRoute(route: string, method?: string): Bookmark[] {
  return getBookmarks().filter(
    (b) => b.route === route && (method === undefined || b.method === method)
  );
}
