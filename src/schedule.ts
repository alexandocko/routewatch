import { RouteRecord } from './types';

export interface ScheduleEntry {
  id: string;
  label: string;
  cronExpression: string;
  route: string;
  method: string;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

const schedules = new Map<string, ScheduleEntry>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function addSchedule(
  label: string,
  cronExpression: string,
  route: string,
  method: string
): ScheduleEntry {
  const entry: ScheduleEntry = {
    id: generateId(),
    label,
    cronExpression,
    route,
    method: method.toUpperCase(),
    createdAt: Date.now(),
    triggerCount: 0,
  };
  schedules.set(entry.id, entry);
  return entry;
}

export function getSchedule(id: string): ScheduleEntry | undefined {
  return schedules.get(id);
}

export function listSchedules(): ScheduleEntry[] {
  return Array.from(schedules.values());
}

export function deleteSchedule(id: string): boolean {
  return schedules.delete(id);
}

export function clearSchedules(): void {
  schedules.clear();
}

export function recordTrigger(id: string): ScheduleEntry | undefined {
  const entry = schedules.get(id);
  if (!entry) return undefined;
  entry.lastTriggered = Date.now();
  entry.triggerCount += 1;
  return entry;
}

export function matchSchedules(records: RouteRecord[]): ScheduleEntry[] {
  const routeSet = new Set(records.map((r) => `${r.method.toUpperCase()}:${r.path}`));
  return listSchedules().filter((s) => routeSet.has(`${s.method}:${s.route}`));
}

/**
 * Updates mutable fields of an existing schedule entry.
 * Returns the updated entry, or undefined if no schedule with the given id exists.
 */
export function updateSchedule(
  id: string,
  updates: Partial<Pick<ScheduleEntry, 'label' | 'cronExpression' | 'route' | 'method'>>
): ScheduleEntry | undefined {
  const entry = schedules.get(id);
  if (!entry) return undefined;
  if (updates.label !== undefined) entry.label = updates.label;
  if (updates.cronExpression !== undefined) entry.cronExpression = updates.cronExpression;
  if (updates.route !== undefined) entry.route = updates.route;
  if (updates.method !== undefined) entry.method = updates.method.toUpperCase();
  return entry;
}
