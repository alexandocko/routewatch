export interface BreadcrumbRecord {
  id: string;
  sessionId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export type BreadcrumbInput = Omit<BreadcrumbRecord, "id" | "timestamp">;

let store: BreadcrumbRecord[] = [];
let counter = 0;

export function generateId(): string {
  return `bc-${Date.now()}-${++counter}`;
}

export function recordBreadcrumb(input: BreadcrumbInput): BreadcrumbRecord {
  const entry: BreadcrumbRecord = {
    id: generateId(),
    timestamp: Date.now(),
    ...input,
  };
  store.push(entry);
  return entry;
}

export function getBreadcrumbBySession(sessionId: string): BreadcrumbRecord[] {
  return store.filter((b) => b.sessionId === sessionId);
}

export function listBreadcrumbs(): BreadcrumbRecord[] {
  return [...store];
}

export function deleteBreadcrumb(sessionId: string): void {
  store = store.filter((b) => b.sessionId !== sessionId);
}

export function clearBreadcrumbs(): void {
  store = [];
  counter = 0;
}
