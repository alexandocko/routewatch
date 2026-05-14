import { RouteRecord } from './types';

export interface CircuitRule {
  id: string;
  route: string;
  method: string;
  errorThreshold: number;   // percentage 0-100
  windowMs: number;         // rolling window in ms
  tripDurationMs: number;   // how long to stay open
  state: 'closed' | 'open' | 'half-open';
  openedAt?: number;
}

export interface CircuitStatus {
  rule: CircuitRule;
  errorRate: number;
  tripped: boolean;
}

const rules = new Map<string, CircuitRule>();

export function addCircuitRule(rule: Omit<CircuitRule, 'state'>): CircuitRule {
  const full: CircuitRule = { ...rule, state: 'closed' };
  rules.set(rule.id, full);
  return full;
}

export function removeCircuitRule(id: string): boolean {
  return rules.delete(id);
}

export function getCircuitRules(): CircuitRule[] {
  return Array.from(rules.values());
}

export function clearCircuitRules(): void {
  rules.clear();
}

export function evaluateCircuits(records: RouteRecord[]): CircuitStatus[] {
  const now = Date.now();
  const statuses: CircuitStatus[] = [];

  for (const rule of rules.values()) {
    // Auto-recover from open after tripDuration
    if (rule.state === 'open' && rule.openedAt !== undefined) {
      if (now - rule.openedAt >= rule.tripDurationMs) {
        rule.state = 'half-open';
      }
    }

    const windowStart = now - rule.windowMs;
    const relevant = records.filter(
      (r) =>
        r.method.toUpperCase() === rule.method.toUpperCase() &&
        r.path === rule.route &&
        r.timestamp >= windowStart
    );

    const total = relevant.length;
    const errors = relevant.filter((r) => r.status >= 500).length;
    const errorRate = total === 0 ? 0 : (errors / total) * 100;

    const tripped = errorRate >= rule.errorThreshold && total > 0;

    if (tripped && rule.state !== 'open') {
      rule.state = 'open';
      rule.openedAt = now;
    } else if (!tripped && rule.state === 'half-open') {
      rule.state = 'closed';
      rule.openedAt = undefined;
    }

    statuses.push({ rule: { ...rule }, errorRate, tripped });
  }

  return statuses;
}
