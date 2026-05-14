import { RouteRecord } from './types';

export interface ThrottleRule {
  id: string;
  method: string;
  path: string;
  maxRpm: number; // max requests per minute
  createdAt: number;
}

export interface ThrottleViolation {
  ruleId: string;
  method: string;
  path: string;
  currentRpm: number;
  maxRpm: number;
  detectedAt: number;
}

const rules: ThrottleRule[] = [];

export function addThrottleRule(rule: Omit<ThrottleRule, 'id' | 'createdAt'>): ThrottleRule {
  const entry: ThrottleRule = {
    ...rule,
    id: `${rule.method}:${rule.path}:${Date.now()}`,
    createdAt: Date.now(),
  };
  rules.push(entry);
  return entry;
}

export function removeThrottleRule(id: string): boolean {
  const idx = rules.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rules.splice(idx, 1);
  return true;
}

export function getThrottleRules(): ThrottleRule[] {
  return [...rules];
}

export function clearThrottleRules(): void {
  rules.length = 0;
}

export function evaluateThrottle(
  records: RouteRecord[],
  windowMs = 60_000
): ThrottleViolation[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  const violations: ThrottleViolation[] = [];

  for (const rule of rules) {
    const count = records.filter(
      r =>
        r.method.toUpperCase() === rule.method.toUpperCase() &&
        r.path === rule.path &&
        r.timestamp >= cutoff
    ).length;

    const rpm = (count / windowMs) * 60_000;

    if (rpm > rule.maxRpm) {
      violations.push({
        ruleId: rule.id,
        method: rule.method,
        path: rule.path,
        currentRpm: Math.round(rpm * 100) / 100,
        maxRpm: rule.maxRpm,
        detectedAt: now,
      });
    }
  }

  return violations;
}
