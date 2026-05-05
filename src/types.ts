/**
 * Core types for routewatch middleware.
 */

/** A single recorded API request. */
export interface RouteRecord {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

/** Aggregated statistics for a specific route (method + path). */
export interface RouteStats {
  method: string;
  path: string;
  count: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  statusCodes: Record<number, number>;
  lastCalledAt: number;
}

/** Options passed to the routewatch middleware factory. */
export interface RouteWatchOptions {
  /**
   * Maximum number of records to keep in memory.
   * Oldest records are dropped when the limit is exceeded.
   * @default 1000
   */
  maxRecords?: number;

  /**
   * Path prefix for the built-in dashboard router.
   * @default '/__routewatch'
   */
  dashboardPath?: string;

  /**
   * If true, log each request to stdout as it is recorded.
   * @default false
   */
  verbose?: boolean;
}

/** Shape of the JSON payload returned by the dashboard API. */
export interface DashboardPayload {
  generatedAt: number;
  totalRequests: number;
  routes: RouteStats[];
}
