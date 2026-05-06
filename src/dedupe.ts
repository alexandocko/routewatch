import { RouteRecord } from "./types";

export interface DedupeOptions {
  windowMs?: number;
  fields?: Array<"method" | "path" | "statusCode" | "ip">;
}

const DEFAULT_WINDOW_MS = 1000;
const DEFAULT_FIELDS: DedupeOptions["fields"] = ["method", "path"];

function makeKey(
  record: RouteRecord,
  fields: NonNullable<DedupeOptions["fields"]>
): string {
  return fields
    .map((f) => String(record[f] ?? ""))
    .join("|");
}

/**
 * Deduplicates records that share the same key within a sliding time window.
 * Returns only the first occurrence of each duplicate group.
 */
export function dedupeRecords(
  records: RouteRecord[],
  options: DedupeOptions = {}
): RouteRecord[] {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const fields = options.fields ?? DEFAULT_FIELDS;

  const seen = new Map<string, number>(); // key -> last timestamp seen
  const result: RouteRecord[] = [];

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  for (const record of sorted) {
    const key = makeKey(record, fields);
    const lastSeen = seen.get(key);

    if (lastSeen === undefined || record.timestamp - lastSeen >= windowMs) {
      seen.set(key, record.timestamp);
      result.push(record);
    }
  }

  return result;
}

/**
 * Counts duplicates per key within the given records and window.
 */
export function countDuplicates(
  records: RouteRecord[],
  options: DedupeOptions = {}
): Record<string, number> {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const fields = options.fields ?? DEFAULT_FIELDS;

  const seen = new Map<string, number>();
  const counts: Record<string, number> = {};

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  for (const record of sorted) {
    const key = makeKey(record, fields);
    const lastSeen = seen.get(key);

    if (lastSeen !== undefined && record.timestamp - lastSeen < windowMs) {
      counts[key] = (counts[key] ?? 1) + 1;
    } else {
      seen.set(key, record.timestamp);
    }
  }

  return counts;
}
