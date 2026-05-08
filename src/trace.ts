import { RouteRecord } from './types';

export interface TraceEntry {
  id: string;
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  tags?: string[];
  meta?: Record<string, unknown>;
}

let traceStore: TraceEntry[] = [];

export function recordTrace(record: RouteRecord, traceId: string): TraceEntry {
  const entry: TraceEntry = {
    id: `${traceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    traceId,
    method: record.method,
    path: record.path,
    statusCode: record.statusCode,
    duration: record.duration,
    timestamp: record.timestamp,
    tags: record.tags,
    meta: record.meta,
  };
  traceStore.push(entry);
  return entry;
}

export function getTraceById(traceId: string): TraceEntry[] {
  return traceStore.filter((e) => e.traceId === traceId);
}

export function getAllTraces(): TraceEntry[] {
  return [...traceStore];
}

export function listTraceIds(): string[] {
  const ids = new Set(traceStore.map((e) => e.traceId));
  return Array.from(ids);
}

export function clearTraces(): void {
  traceStore = [];
}

export function getTraceStats(traceId: string): {
  count: number;
  totalDuration: number;
  avgDuration: number;
  errorCount: number;
} {
  const entries = getTraceById(traceId);
  const count = entries.length;
  const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = count > 0 ? totalDuration / count : 0;
  const errorCount = entries.filter((e) => e.statusCode >= 400).length;
  return { count, totalDuration, avgDuration, errorCount };
}
