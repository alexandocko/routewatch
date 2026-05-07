import { RouteRecord } from './types';

export interface Snapshot {
  id: string;
  label: string;
  createdAt: number;
  records: RouteRecord[];
}

const snapshots: Map<string, Snapshot> = new Map();

function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createSnapshot(records: RouteRecord[], label?: string): Snapshot {
  const id = generateId();
  const snapshot: Snapshot = {
    id,
    label: label ?? `Snapshot ${snapshots.size + 1}`,
    createdAt: Date.now(),
    records: records.map(r => ({ ...r })),
  };
  snapshots.set(id, snapshot);
  return snapshot;
}

export function getSnapshot(id: string): Snapshot | undefined {
  return snapshots.get(id);
}

export function listSnapshots(): Snapshot[] {
  return Array.from(snapshots.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteSnapshot(id: string): boolean {
  return snapshots.delete(id);
}

export function clearSnapshots(): void {
  snapshots.clear();
}

export function getSnapshotCount(): number {
  return snapshots.size;
}
