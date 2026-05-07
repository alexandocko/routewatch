import { RouteRecord } from './types';

export interface RetentionOptions {
  maxRecords?: number;
  maxAgeMs?: number;
}

const DEFAULT_MAX_RECORDS = 1000;
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Prune records that exceed the maximum count (oldest first).
 */
export function pruneByCount(
  records: RouteRecord[],
  maxRecords: number = DEFAULT_MAX_RECORDS
): RouteRecord[] {
  if (records.length <= maxRecords) return records;
  return records.slice(records.length - maxRecords);
}

/**
 * Prune records older than maxAgeMs milliseconds.
 */
export function pruneByAge(
  records: RouteRecord[],
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
  now: number = Date.now()
): RouteRecord[] {
  const cutoff = now - maxAgeMs;
  return records.filter((r) => r.timestamp >= cutoff);
}

/**
 * Apply both age and count retention policies.
 * Age pruning is applied first, then count pruning.
 */
export function applyRetention(
  records: RouteRecord[],
  options: RetentionOptions = {},
  now: number = Date.now()
): RouteRecord[] {
  const { maxRecords = DEFAULT_MAX_RECORDS, maxAgeMs = DEFAULT_MAX_AGE_MS } = options;
  const afterAge = pruneByAge(records, maxAgeMs, now);
  return pruneByCount(afterAge, maxRecords);
}

/**
 * Return retention stats for the current record set.
 */
export function getRetentionStats(
  records: RouteRecord[],
  options: RetentionOptions = {},
  now: number = Date.now()
): { total: number; retained: number; pruned: number } {
  const retained = applyRetention(records, options, now);
  return {
    total: records.length,
    retained: retained.length,
    pruned: records.length - retained.length,
  };
}
