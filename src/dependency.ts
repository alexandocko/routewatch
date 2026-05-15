import { RouteRecord } from './types';

export interface RouteDependency {
  from: string;
  to: string;
  count: number;
  avgLatency: number;
}

export interface DependencyGraph {
  nodes: string[];
  edges: RouteDependency[];
}

const refererKey = (record: RouteRecord): string | null => {
  const ref = (record as any).referer as string | undefined;
  if (!ref) return null;
  try {
    const url = new URL(ref);
    return url.pathname;
  } catch {
    return ref.startsWith('/') ? ref : null;
  }
};

export function computeDependencies(records: RouteRecord[]): DependencyGraph {
  const edgeMap = new Map<string, { count: number; totalLatency: number }>();
  const nodeSet = new Set<string>();

  for (const record of records) {
    const to = record.path;
    const from = refererKey(record);
    nodeSet.add(to);
    if (!from || from === to) continue;
    nodeSet.add(from);
    const key = `${from}→${to}`;
    const existing = edgeMap.get(key) ?? { count: 0, totalLatency: 0 };
    existing.count += 1;
    existing.totalLatency += record.duration ?? 0;
    edgeMap.set(key, existing);
  }

  const edges: RouteDependency[] = [];
  for (const [key, { count, totalLatency }] of edgeMap.entries()) {
    const [from, to] = key.split('→');
    edges.push({
      from,
      to,
      count,
      avgLatency: count > 0 ? Math.round(totalLatency / count) : 0,
    });
  }

  edges.sort((a, b) => b.count - a.count);

  return {
    nodes: Array.from(nodeSet).sort(),
    edges,
  };
}
