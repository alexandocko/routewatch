import { RouteRecord } from './types';

export interface TrendPoint {
  timestamp: number;
  count: number;
  avgDuration: number;
  errorRate: number;
}

export interface RouteTrend {
  route: string;
  method: string;
  points: TrendPoint[];
}

/**
 * Buckets records into time windows and computes per-bucket stats.
 * @param records - The route records to analyze
 * @param bucketMs - Size of each time bucket in milliseconds (default: 60000 = 1 min)
 */
export function computeTrends(
  records: RouteRecord[],
  bucketMs: number = 60_000
): RouteTrend[] {
  const grouped = new Map<string, RouteRecord[]>();

  for (const record of records) {
    const key = `${record.method}:${record.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(record);
  }

  const trends: RouteTrend[] = [];

  for (const [key, recs] of grouped.entries()) {
    const [method, route] = key.split(/:(.+)/);
    if (!recs.length) continue;

    const minTs = Math.min(...recs.map((r) => r.timestamp));
    const maxTs = Math.max(...recs.map((r) => r.timestamp));
    const bucketCount = Math.ceil((maxTs - minTs) / bucketMs) + 1;

    const points: TrendPoint[] = Array.from({ length: bucketCount }, (_, i) => ({
      timestamp: minTs + i * bucketMs,
      count: 0,
      avgDuration: 0,
      errorRate: 0,
    }));

    for (const rec of recs) {
      const idx = Math.floor((rec.timestamp - minTs) / bucketMs);
      const pt = points[idx];
      pt.count += 1;
      pt.avgDuration += rec.duration;
      if (rec.status >= 400) pt.errorRate += 1;
    }

    for (const pt of points) {
      if (pt.count > 0) {
        pt.avgDuration = Math.round(pt.avgDuration / pt.count);
        pt.errorRate = parseFloat((pt.errorRate / pt.count).toFixed(4));
      }
    }

    trends.push({ route, method, points });
  }

  return trends;
}
