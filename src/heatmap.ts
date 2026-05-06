import { RouteRecord } from './types';

export interface HeatmapCell {
  hour: number;   // 0-23
  day: number;    // 0-6 (Sunday=0)
  count: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  maxCount: number;
  totalRequests: number;
}

/**
 * Builds a 7x24 heatmap (day-of-week x hour-of-day) from route records.
 */
export function computeHeatmap(
  records: RouteRecord[],
  route?: string,
  method?: string
): HeatmapData {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const filtered = records.filter((r) => {
    if (route && r.path !== route) return false;
    if (method && r.method.toUpperCase() !== method.toUpperCase()) return false;
    return true;
  });

  for (const record of filtered) {
    const date = new Date(record.timestamp);
    const day = date.getDay();    // 0-6
    const hour = date.getHours(); // 0-23
    grid[day][hour] += 1;
  }

  const cells: HeatmapCell[] = [];
  let maxCount = 0;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = grid[day][hour];
      cells.push({ hour, day, count });
      if (count > maxCount) maxCount = count;
    }
  }

  return {
    cells,
    maxCount,
    totalRequests: filtered.length,
  };
}
