import { RouteRecord } from './types';

export interface SlowlogEntry {
  method: string;
  path: string;
  duration: number;
  timestamp: number;
  statusCode: number;
}

export interface SlowlogOptions {
  threshold?: number; // ms, default 500
  limit?: number;     // max entries to keep, default 100
}

const DEFAULT_THRESHOLD = 500;
const DEFAULT_LIMIT = 100;

let slowlogEntries: SlowlogEntry[] = [];

export function recordSlowlog(
  record: RouteRecord,
  options: SlowlogOptions = {}
): SlowlogEntry | null {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  if (record.duration < threshold) return null;

  const entry: SlowlogEntry = {
    method: record.method,
    path: record.path,
    duration: record.duration,
    timestamp: record.timestamp,
    statusCode: record.statusCode,
  };

  slowlogEntries.push(entry);

  const limit = options.limit ?? DEFAULT_LIMIT;
  if (slowlogEntries.length > limit) {
    slowlogEntries = slowlogEntries.slice(-limit);
  }

  return entry;
}

export function getSlowlogEntries(): SlowlogEntry[] {
  return [...slowlogEntries];
}

export function clearSlowlog(): void {
  slowlogEntries = [];
}

export function getSlowlogStats(entries: SlowlogEntry[] = slowlogEntries) {
  if (entries.length === 0) {
    return { count: 0, avgDuration: 0, maxDuration: 0, topRoutes: [] };
  }

  const durations = entries.map((e) => e.duration);
  const avgDuration = Math.round(
    durations.reduce((a, b) => a + b, 0) / durations.length
  );
  const maxDuration = Math.max(...durations);

  const routeMap: Record<string, { count: number; total: number }> = {};
  for (const entry of entries) {
    const key = `${entry.method} ${entry.path}`;
    if (!routeMap[key]) routeMap[key] = { count: 0, total: 0 };
    routeMap[key].count++;
    routeMap[key].total += entry.duration;
  }

  const topRoutes = Object.entries(routeMap)
    .map(([route, { count, total }]) => ({
      route,
      count,
      avgDuration: Math.round(total / count),
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 5);

  return { count: entries.length, avgDuration, maxDuration, topRoutes };
}
