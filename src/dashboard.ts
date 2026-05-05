import { Request, Response, Router } from 'express';
import { getRecords } from './middleware';

export interface RouteStats {
  method: string;
  path: string;
  count: number;
  avgDurationMs: number;
  lastCalledAt: string | null;
  statusCodes: Record<number, number>;
}

export function computeStats(): RouteStats[] {
  const records = getRecords();
  const statsMap = new Map<string, RouteStats>();

  for (const record of records) {
    const key = `${record.method}:${record.path}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        method: record.method,
        path: record.path,
        count: 0,
        avgDurationMs: 0,
        lastCalledAt: null,
        statusCodes: {},
      });
    }

    const stat = statsMap.get(key)!;
    const prevTotal = stat.avgDurationMs * stat.count;
    stat.count += 1;
    stat.avgDurationMs = Math.round((prevTotal + record.durationMs) / stat.count);
    stat.lastCalledAt = record.timestamp;
    stat.statusCodes[record.statusCode] = (stat.statusCodes[record.statusCode] ?? 0) + 1;
  }

  return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
}

export function createDashboardRouter(): Router {
  const router = Router();

  router.get('/routewatch', (_req: Request, res: Response) => {
    const stats = computeStats();
    const html = renderHtml(stats);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  router.get('/routewatch/json', (_req: Request, res: Response) => {
    res.json(computeStats());
  });

  return router;
}

function renderHtml(stats: RouteStats[]): string {
  const rows = stats
    .map(
      (s) => `
      <tr>
        <td><span class="method method-${s.method.toLowerCase()}">${s.method}</span></td>
        <td>${s.path}</td>
        <td>${s.count}</td>
        <td>${s.avgDurationMs} ms</td>
        <td>${s.lastCalledAt ?? '-'}</td>
        <td>${Object.entries(s.statusCodes)
          .map(([code, n]) => `${code} (${n})`)
          .join(', ')}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RouteWatch Dashboard</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f9fafb; color: #111; }
    h1 { margin-bottom: 1rem; }
    table { border-collapse: collapse; width: 100%; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    th, td { padding: .6rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: .9rem; }
    th { background: #f3f4f6; font-weight: 600; }
    .method { padding: .2rem .5rem; border-radius: 4px; font-size: .75rem; font-weight: 700; color: #fff; }
    .method-get { background: #10b981; } .method-post { background: #3b82f6; }
    .method-put { background: #f59e0b; } .method-patch { background: #8b5cf6; }
    .method-delete { background: #ef4444; }
  </style>
</head>
<body>
  <h1>🔍 RouteWatch Dashboard</h1>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Hits</th><th>Avg Duration</th><th>Last Called</th><th>Status Codes</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">No requests recorded yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}
