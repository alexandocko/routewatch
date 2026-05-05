import { RouteRecord, ExportFormat } from './types';

/**
 * Serializes route records to a JSON string.
 */
export function toJson(records: RouteRecord[]): string {
  return JSON.stringify(records, null, 2);
}

/**
 * Serializes route records to CSV format.
 * Columns: method, path, statusCode, duration, timestamp
 *
 * Fields containing commas or quotes are wrapped in double quotes.
 */
export function toCsv(records: RouteRecord[]): string {
  const header = 'method,path,statusCode,duration,timestamp';
  const rows = records.map((r) => {
    const ts = new Date(r.timestamp).toISOString();
    const path = r.path.includes(',') ? `"${r.path}"` : r.path;
    return `${r.method},${path},${r.statusCode},${r.duration},${ts}`;
  });
  return [header, ...rows].join('\n');
}

/**
 * Returns the appropriate Content-Type header value for a given format.
 */
export function contentTypeFor(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'json':
    default:
      return 'application/json';
  }
}

/**
 * Serializes records in the requested format.
 * Defaults to JSON for unknown formats.
 */
export function exportRecords(
  records: RouteRecord[],
  format: ExportFormat
): string {
  switch (format) {
    case 'csv':
      return toCsv(records);
    case 'json':
    default:
      return toJson(records);
  }
}
