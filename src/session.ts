import { RouteRecord } from './types';

export interface SessionSummary {
  sessionId: string;
  requestCount: number;
  routes: string[];
  totalDuration: number;
  avgDuration: number;
  firstSeen: number;
  lastSeen: number;
  errorCount: number;
}

const sessionMap = new Map<string, RouteRecord[]>();

export function recordSession(sessionId: string, record: RouteRecord): void {
  if (!sessionMap.has(sessionId)) {
    sessionMap.set(sessionId, []);
  }
  sessionMap.get(sessionId)!.push(record);
}

export function getSession(sessionId: string): RouteRecord[] {
  return sessionMap.get(sessionId) ?? [];
}

export function listSessions(): string[] {
  return Array.from(sessionMap.keys());
}

export function deleteSession(sessionId: string): boolean {
  return sessionMap.delete(sessionId);
}

export function clearSessions(): void {
  sessionMap.clear();
}

export function summarizeSession(sessionId: string): SessionSummary | null {
  const records = sessionMap.get(sessionId);
  if (!records || records.length === 0) return null;

  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
  const routes = Array.from(new Set(records.map(r => `${r.method} ${r.path}`)));
  const errorCount = records.filter(r => r.status >= 400).length;
  const timestamps = records.map(r => r.timestamp);

  return {
    sessionId,
    requestCount: records.length,
    routes,
    totalDuration,
    avgDuration: totalDuration / records.length,
    firstSeen: Math.min(...timestamps),
    lastSeen: Math.max(...timestamps),
    errorCount,
  };
}
