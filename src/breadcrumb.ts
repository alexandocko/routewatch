import { RouteRecord } from './types';

export interface Breadcrumb {
  id: string;
  sessionId: string;
  steps: BreadcrumbStep[];
  createdAt: number;
  updatedAt: number;
}

export interface BreadcrumbStep {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

const store = new Map<string, Breadcrumb>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function recordBreadcrumb(sessionId: string, record: RouteRecord): void {
  const step: BreadcrumbStep = {
    method: record.method,
    path: record.path,
    statusCode: record.statusCode,
    duration: record.duration,
    timestamp: record.timestamp,
  };

  const existing = [...store.values()].find((b) => b.sessionId === sessionId);

  if (existing) {
    existing.steps.push(step);
    existing.updatedAt = Date.now();
  } else {
    const id = generateId();
    store.set(id, {
      id,
      sessionId,
      steps: [step],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

export function getBreadcrumbBySession(sessionId: string): Breadcrumb | undefined {
  return [...store.values()].find((b) => b.sessionId === sessionId);
}

export function listBreadcrumbs(): Breadcrumb[] {
  return [...store.values()];
}

export function deleteBreadcrumb(sessionId: string): boolean {
  const entry = [...store.entries()].find(([, b]) => b.sessionId === sessionId);
  if (!entry) return false;
  store.delete(entry[0]);
  return true;
}

export function clearBreadcrumbs(): void {
  store.clear();
}
