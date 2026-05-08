import { RouteRecord } from "./types";

export interface QuotaRule {
  route: string;
  method?: string;
  maxRequests: number;
  windowMs: number;
}

export interface QuotaStatus {
  route: string;
  method: string;
  maxRequests: number;
  windowMs: number;
  count: number;
  exceeded: boolean;
  resetAt: number;
}

const quotaRules: QuotaRule[] = [];

export function addQuotaRule(rule: QuotaRule): void {
  quotaRules.push(rule);
}

export function removeQuotaRule(route: string, method?: string): void {
  const idx = quotaRules.findIndex(
    (r) => r.route === route && (method === undefined || r.method === method)
  );
  if (idx !== -1) quotaRules.splice(idx, 1);
}

export function getQuotaRules(): QuotaRule[] {
  return [...quotaRules];
}

export function clearQuotaRules(): void {
  quotaRules.length = 0;
}

export function evaluateQuotas(
  records: RouteRecord[],
  now: number = Date.now()
): QuotaStatus[] {
  return quotaRules.map((rule) => {
    const method = rule.method?.toUpperCase() ?? "*";
    const windowStart = now - rule.windowMs;

    const count = records.filter((r) => {
      const matchRoute = r.path === rule.route;
      const matchMethod =
        method === "*" || r.method.toUpperCase() === method;
      const inWindow = r.timestamp >= windowStart;
      return matchRoute && matchMethod && inWindow;
    }).length;

    return {
      route: rule.route,
      method,
      maxRequests: rule.maxRequests,
      windowMs: rule.windowMs,
      count,
      exceeded: count > rule.maxRequests,
      resetAt: now + rule.windowMs,
    };
  });
}
