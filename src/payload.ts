import { RouteRecord } from './types';

export interface PayloadStats {
  route: string;
  method: string;
  sampleCount: number;
  avgRequestSize: number;
  avgResponseSize: number;
  maxRequestSize: number;
  maxResponseSize: number;
  totalRequestBytes: number;
  totalResponseBytes: number;
}

export interface PayloadEntry {
  route: string;
  method: string;
  requestSize: number;
  responseSize: number;
  timestamp: number;
}

const entries: PayloadEntry[] = [];

export function recordPayload(record: RouteRecord): void {
  const requestSize =
    typeof record.requestSize === 'number' ? record.requestSize : 0;
  const responseSize =
    typeof record.responseSize === 'number' ? record.responseSize : 0;

  entries.push({
    route: record.path,
    method: record.method,
    requestSize,
    responseSize,
    timestamp: record.timestamp,
  });
}

export function getPayloadEntries(): PayloadEntry[] {
  return [...entries];
}

export function clearPayloadEntries(): void {
  entries.length = 0;
}

export function computePayloadStats(): PayloadStats[] {
  const grouped = new Map<string, PayloadEntry[]>();

  for (const entry of entries) {
    const key = `${entry.method}:${entry.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  const stats: PayloadStats[] = [];

  for (const [key, group] of grouped.entries()) {
    const [method, ...routeParts] = key.split(':');
    const route = routeParts.join(':');
    const totalReq = group.reduce((s, e) => s + e.requestSize, 0);
    const totalRes = group.reduce((s, e) => s + e.responseSize, 0);
    const maxReq = Math.max(...group.map((e) => e.requestSize));
    const maxRes = Math.max(...group.map((e) => e.responseSize));

    stats.push({
      route,
      method,
      sampleCount: group.length,
      avgRequestSize: Math.round(totalReq / group.length),
      avgResponseSize: Math.round(totalRes / group.length),
      maxRequestSize: maxReq,
      maxResponseSize: maxRes,
      totalRequestBytes: totalReq,
      totalResponseBytes: totalRes,
    });
  }

  return stats.sort((a, b) => b.totalResponseBytes - a.totalResponseBytes);
}
