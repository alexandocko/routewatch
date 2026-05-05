import { RouteRecord } from './types';

export interface RouteSummary {
  method: string;
  path: string;
  count: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  errorRate: number;
  lastCalledAt: Date | null;
}

export interface SummaryReport {
  totalRequests: number;
  uniqueRoutes: number;
  overallAvgDurationMs: number;
  errorRate: number;
  generatedAt: Date;
  routes: RouteSummary[];
}

export function buildSummary(records: RouteRecord[]): SummaryReport {
  const grouped = new Map<string, RouteRecord[]>();

  for (const record of records) {
    const key = `${record.method}:${record.path}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(record);
  }

  const routes: RouteSummary[] = [];

  for (const [key, group] of grouped.entries()) {
    const [method, path] = key.split(/:(.+)/);
    const durations = group.map((r) => r.durationMs);
    const errors = group.filter((r) => r.statusCode >= 400).length;
    const timestamps = group.map((r) => r.timestamp).filter(Boolean) as Date[];

    routes.push({
      method,
      path,
      count: group.length,
      avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDurationMs: Math.min(...durations),
      maxDurationMs: Math.max(...durations),
      errorRate: errors / group.length,
      lastCalledAt: timestamps.length
        ? new Date(Math.max(...timestamps.map((d) => d.getTime())))
        : null,
    });
  }

  routes.sort((a, b) => b.count - a.count);

  const totalDuration = records.reduce((sum, r) => sum + r.durationMs, 0);
  const totalErrors = records.filter((r) => r.statusCode >= 400).length;

  return {
    totalRequests: records.length,
    uniqueRoutes: grouped.size,
    overallAvgDurationMs: records.length ? totalDuration / records.length : 0,
    errorRate: records.length ? totalErrors / records.length : 0,
    generatedAt: new Date(),
    routes,
  };
}
