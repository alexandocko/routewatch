/**
 * fieldMask.ts
 * Utilities for masking sensitive fields in route records before logging/export.
 */

import { RouteRecord } from "./types";

export interface FieldMaskOptions {
  fields: string[];
  replacement?: string;
}

const defaultReplacement = "[REDACTED]";

let maskConfig: FieldMaskOptions = {
  fields: [],
  replacement: defaultReplacement,
};

export function setMaskConfig(options: FieldMaskOptions): void {
  maskConfig = {
    replacement: defaultReplacement,
    ...options,
  };
}

export function getMaskConfig(): FieldMaskOptions {
  return { ...maskConfig };
}

export function resetMaskConfig(): void {
  maskConfig = { fields: [], replacement: defaultReplacement };
}

export function maskValue(value: unknown, replacement: string): string {
  return replacement;
}

export function maskObject(
  obj: Record<string, unknown>,
  fields: string[],
  replacement: string
): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return obj;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (fields.includes(key)) {
      result[key] = maskValue(val, replacement);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = maskObject(val as Record<string, unknown>, fields, replacement);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function applyFieldMask(record: RouteRecord): RouteRecord {
  const { fields, replacement = defaultReplacement } = maskConfig;
  if (fields.length === 0) return record;

  const masked = { ...record } as Record<string, unknown>;

  for (const field of fields) {
    if (field in masked) {
      masked[field] = maskValue(masked[field], replacement);
    }
  }

  if (masked.meta && typeof masked.meta === "object") {
    masked.meta = maskObject(
      masked.meta as Record<string, unknown>,
      fields,
      replacement
    );
  }

  return masked as RouteRecord;
}

export function applyFieldMaskToAll(records: RouteRecord[]): RouteRecord[] {
  return records.map(applyFieldMask);
}
