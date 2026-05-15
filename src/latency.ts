import { RouteRecord } from './types';

export interface LatencyBucket {
  route: string;
  method: string;
  p50: number;
  p75: number;
  p90: number;
  p99: number;
  min: number;
  max: number;
  count: number;
}

export interface LatencyStats {
  buckets: LatencyBucket[];
  overall: Omit<LatencyBucket, 'route' | 'method'>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function buildBucket(
  route: string,
  method: string,
  durations: number[]
): LatencyBucket {
  const sorted = [...durations].sort((a, b) => a - b);
  return {
    route,
    method,
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    count: sorted.length,
  };
}

export function computeLatency(records: RouteRecord[]): LatencyStats {
  const groups = new Map<string, number[]>();

  for (const r of records) {
    const key = `${r.method}:${r.route}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r.duration);
  }

  const buckets: LatencyBucket[] = [];
  for (const [key, durations] of groups) {
    const [method, route] = key.split(':');
    buckets.push(buildBucket(route, method, durations));
  }

  buckets.sort((a, b) => b.p99 - a.p99);

  const allDurations = records.map((r) => r.duration);
  const overall = buildBucket('*', '*', allDurations);
  const { route: _r, method: _m, ...overallStats } = overall;

  return { buckets, overall: overallStats };
}
