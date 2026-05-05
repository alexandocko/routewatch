import { RouteRecord } from './types';

export interface ReplayEntry {
  id: string;
  record: RouteRecord;
  replayedAt: Date;
  statusCode: number;
  durationMs: number;
  success: boolean;
}

const replayHistory: ReplayEntry[] = [];

export function getReplayHistory(): ReplayEntry[] {
  return [...replayHistory];
}

export function clearReplayHistory(): void {
  replayHistory.length = 0;
}

export async function replayRequest(
  record: RouteRecord,
  baseUrl: string
): Promise<ReplayEntry> {
  const url = `${baseUrl}${record.path}`;
  const start = Date.now();
  let statusCode = 0;
  let success = false;

  try {
    const response = await fetch(url, {
      method: record.method,
      headers: { 'x-routewatch-replay': 'true' },
    });
    statusCode = response.status;
    success = response.ok;
  } catch {
    statusCode = 0;
    success = false;
  }

  const entry: ReplayEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    record,
    replayedAt: new Date(),
    statusCode,
    durationMs: Date.now() - start,
    success,
  };

  replayHistory.push(entry);
  return entry;
}
