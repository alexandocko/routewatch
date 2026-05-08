import { RouteRecord } from './types';

export interface WatchlistEntry {
  id: string;
  method: string;
  path: string;
  label?: string;
  createdAt: number;
  hitCount: number;
  lastSeenAt?: number;
}

const watchlist = new Map<string, WatchlistEntry>();

function makeId(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

export function addToWatchlist(
  method: string,
  path: string,
  label?: string
): WatchlistEntry {
  const id = makeId(method, path);
  if (watchlist.has(id)) {
    return watchlist.get(id)!;
  }
  const entry: WatchlistEntry = {
    id,
    method: method.toUpperCase(),
    path,
    label,
    createdAt: Date.now(),
    hitCount: 0,
  };
  watchlist.set(id, entry);
  return entry;
}

export function removeFromWatchlist(method: string, path: string): boolean {
  return watchlist.delete(makeId(method, path));
}

export function getWatchlist(): WatchlistEntry[] {
  return Array.from(watchlist.values());
}

export function getWatchlistEntry(
  method: string,
  path: string
): WatchlistEntry | undefined {
  return watchlist.get(makeId(method, path));
}

export function clearWatchlist(): void {
  watchlist.clear();
}

export function tickWatchlist(record: RouteRecord): void {
  const id = makeId(record.method, record.path);
  const entry = watchlist.get(id);
  if (entry) {
    entry.hitCount += 1;
    entry.lastSeenAt = record.timestamp;
  }
}
