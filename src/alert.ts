import { RouteRecord } from './types';

export interface AlertRule {
  route?: string;
  method?: string;
  maxCount?: number;
  maxAvgDuration?: number;
  minSuccessRate?: number;
}

export interface AlertResult {
  rule: AlertRule;
  triggered: boolean;
  message: string;
  route: string;
  method: string;
  actual: Record<string, number>;
}

export function evaluateAlerts(
  records: RouteRecord[],
  rules: AlertRule[]
): AlertResult[] {
  const results: AlertResult[] = [];

  for (const rule of rules) {
    const filtered = records.filter((r) => {
      const matchRoute = rule.route ? r.path === rule.route : true;
      const matchMethod = rule.method
        ? r.method.toUpperCase() === rule.method.toUpperCase()
        : true;
      return matchRoute && matchMethod;
    });

    if (filtered.length === 0) continue;

    const count = filtered.length;
    const avgDuration =
      filtered.reduce((sum, r) => sum + r.duration, 0) / count;
    const successCount = filtered.filter(
      (r) => r.statusCode >= 200 && r.statusCode < 400
    ).length;
    const successRate = successCount / count;

    const routeLabel = rule.route ?? '*';
    const methodLabel = rule.method ?? '*';
    const actual = { count, avgDuration, successRate };

    if (rule.maxCount !== undefined && count > rule.maxCount) {
      results.push({
        rule,
        triggered: true,
        message: `[${methodLabel} ${routeLabel}] count ${count} exceeds maxCount ${rule.maxCount}`,
        route: routeLabel,
        method: methodLabel,
        actual,
      });
    }

    if (rule.maxAvgDuration !== undefined && avgDuration > rule.maxAvgDuration) {
      results.push({
        rule,
        triggered: true,
        message: `[${methodLabel} ${routeLabel}] avgDuration ${avgDuration.toFixed(1)}ms exceeds maxAvgDuration ${rule.maxAvgDuration}ms`,
        route: routeLabel,
        method: methodLabel,
        actual,
      });
    }

    if (rule.minSuccessRate !== undefined && successRate < rule.minSuccessRate) {
      results.push({
        rule,
        triggered: true,
        message: `[${methodLabel} ${routeLabel}] successRate ${(successRate * 100).toFixed(1)}% below minSuccessRate ${(rule.minSuccessRate * 100).toFixed(1)}%`,
        route: routeLabel,
        method: methodLabel,
        actual,
      });
    }
  }

  return results;
}
