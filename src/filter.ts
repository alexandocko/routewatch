import { RouteRecord } from './types';

export interface FilterOptions {
  method?: string | string[];
  path?: string | RegExp;
  statusCode?: number | number[];
  minDuration?: number;
  maxDuration?: number;
  since?: Date;
  until?: Date;
}

export function filterRecords(
  records: RouteRecord[],
  options: FilterOptions
): RouteRecord[] {
  return records.filter((record) => {
    if (options.method) {
      const methods = Array.isArray(options.method)
        ? options.method.map((m) => m.toUpperCase())
        : [options.method.toUpperCase()];
      if (!methods.includes(record.method.toUpperCase())) return false;
    }

    if (options.path) {
      if (typeof options.path === 'string') {
        if (!record.path.includes(options.path)) return false;
      } else {
        if (!options.path.test(record.path)) return false;
      }
    }

    if (options.statusCode) {
      const codes = Array.isArray(options.statusCode)
        ? options.statusCode
        : [options.statusCode];
      if (!codes.includes(record.statusCode)) return false;
    }

    if (options.minDuration !== undefined && record.duration < options.minDuration) {
      return false;
    }

    if (options.maxDuration !== undefined && record.duration > options.maxDuration) {
      return false;
    }

    if (options.since && new Date(record.timestamp) < options.since) {
      return false;
    }

    if (options.until && new Date(record.timestamp) > options.until) {
      return false;
    }

    return true;
  });
}
