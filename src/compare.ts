import { RouteRecord } from './types';

export interface CompareWindow {
  label: string;
  records: RouteRecord[];
}

export interface RouteComparison {
  method: string;
  path: string;
  countA: number;
  countB: number;
  avgDurationA: number;
  avgDurationB: number;
  countDelta: number;
  durationDelta: number;
}

export interface CompareResult {
  windowA: string;
  windowB: string;
  routes: RouteComparison[];
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function groupByRoute(records: RouteRecord[]): Map<string, RouteRecord[]> {
  const map = new Map<string, RouteRecord[]>();
  for (const r of records) {
    const key = `${r.method}::${r.path}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

export function compareWindows(a: CompareWindow, b: CompareWindow): CompareResult {
  const groupA = groupByRoute(a.records);
  const groupB = groupByRoute(b.records);

  const allKeys = new Set([...groupA.keys(), ...groupB.keys()]);
  const routes: RouteComparison[] = [];

  for (const key of allKeys) {
    const recA = groupA.get(key) ?? [];
    const recB = groupB.get(key) ?? [];
    const [method, path] = key.split('::');

    const countA = recA.length;
    const countB = recB.length;
    const avgDurationA = avg(recA.map(r => r.duration));
    const avgDurationB = avg(recB.map(r => r.duration));

    routes.push({
      method,
      path,
      countA,
      countB,
      avgDurationA: Math.round(avgDurationA),
      avgDurationB: Math.round(avgDurationB),
      countDelta: countB - countA,
      durationDelta: Math.round(avgDurationB - avgDurationA),
    });
  }

  routes.sort((x, y) => Math.abs(y.durationDelta) - Math.abs(x.durationDelta));

  return { windowA: a.label, windowB: b.label, routes };
}
