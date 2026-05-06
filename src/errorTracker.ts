import { RouteRecord } from './types';

export interface ErrorEntry {
  method: string;
  path: string;
  statusCode: number;
  timestamp: number;
  durationMs: number;
  count: number;
}

export interface ErrorSummary {
  totalErrors: number;
  byStatus: Record<number, number>;
  topRoutes: ErrorEntry[];
}

const errorLog: ErrorEntry[] = [];

export function recordError(record: RouteRecord): void {
  if (record.statusCode < 400) return;

  const existing = errorLog.find(
    (e) => e.method === record.method && e.path === record.path && e.statusCode === record.statusCode
  );

  if (existing) {
    existing.count += 1;
    existing.timestamp = record.timestamp;
    existing.durationMs = record.durationMs;
  } else {
    errorLog.push({
      method: record.method,
      path: record.path,
      statusCode: record.statusCode,
      timestamp: record.timestamp,
      durationMs: record.durationMs,
      count: 1,
    });
  }
}

export function getErrorEntries(): ErrorEntry[] {
  return [...errorLog];
}

export function clearErrorLog(): void {
  errorLog.length = 0;
}

export function getErrorSummary(): ErrorSummary {
  const byStatus: Record<number, number> = {};
  let totalErrors = 0;

  for (const entry of errorLog) {
    byStatus[entry.statusCode] = (byStatus[entry.statusCode] ?? 0) + entry.count;
    totalErrors += entry.count;
  }

  const topRoutes = [...errorLog]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { totalErrors, byStatus, topRoutes };
}
