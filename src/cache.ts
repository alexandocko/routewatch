import { RouteRecord } from "./types";

interface CacheEntry {
  route: string;
  method: string;
  hitCount: number;
  missCount: number;
  lastHit: number | null;
  lastMiss: number | null;
}

interface CacheEvent {
  route: string;
  method: string;
  hit: boolean;
  timestamp: number;
  latencyMs?: number;
}

const cacheEvents: CacheEvent[] = [];

export function recordCacheEvent(
  route: string,
  method: string,
  hit: boolean,
  latencyMs?: number
): void {
  cacheEvents.push({
    route,
    method: method.toUpperCase(),
    hit,
    timestamp: Date.now(),
    latencyMs,
  });
}

export function getCacheEvents(): CacheEvent[] {
  return [...cacheEvents];
}

export function clearCacheEvents(): void {
  cacheEvents.length = 0;
}

export function computeCacheStats(): CacheEntry[] {
  const map = new Map<string, CacheEntry>();

  for (const event of cacheEvents) {
    const key = `${event.method}:${event.route}`;
    if (!map.has(key)) {
      map.set(key, {
        route: event.route,
        method: event.method,
        hitCount: 0,
        missCount: 0,
        lastHit: null,
        lastMiss: null,
      });
    }
    const entry = map.get(key)!;
    if (event.hit) {
      entry.hitCount++;
      entry.lastHit = event.timestamp;
    } else {
      entry.missCount++;
      entry.lastMiss = event.timestamp;
    }
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    hitRate:
      entry.hitCount + entry.missCount > 0
        ? entry.hitCount / (entry.hitCount + entry.missCount)
        : 0,
  }));
}

export function getCacheStatsByRoute(route: string, method: string): CacheEntry | null {
  const stats = computeCacheStats();
  return (
    stats.find(
      (s) => s.route === route && s.method === method.toUpperCase()
    ) ?? null
  );
}
