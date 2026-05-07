import { RouteRecord } from './types';

export interface AnomalyEntry {
  route: string;
  method: string;
  avgDuration: number;
  stdDev: number;
  threshold: number;
  outliers: number[];
  flagged: boolean;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function detectAnomalies(
  records: RouteRecord[],
  multiplier = 2.5
): AnomalyEntry[] {
  const grouped = new Map<string, number[]>();

  for (const r of records) {
    const key = `${r.method}:${r.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r.duration);
  }

  const results: AnomalyEntry[] = [];

  for (const [key, durations] of grouped.entries()) {
    const [method, route] = key.split(':');
    const avg = mean(durations);
    const sd = stddev(durations, avg);
    const threshold = avg + multiplier * sd;
    const outliers = durations.filter((d) => d > threshold);

    results.push({
      route,
      method,
      avgDuration: Math.round(avg * 100) / 100,
      stdDev: Math.round(sd * 100) / 100,
      threshold: Math.round(threshold * 100) / 100,
      outliers,
      flagged: outliers.length > 0,
    });
  }

  return results.sort((a, b) => b.outliers.length - a.outliers.length);
}
