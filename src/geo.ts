import { RouteRecord } from './types';

export interface GeoEntry {
  ip: string;
  country: string;
  region: string;
  city: string;
  count: number;
  lastSeen: number;
}

export interface GeoStats {
  totalUnique: number;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  topIps: Array<{ ip: string; count: number }>;
  entries: GeoEntry[];
}

const geoStore = new Map<string, GeoEntry>();

export function recordGeo(
  ip: string,
  country: string,
  region: string,
  city: string
): void {
  const existing = geoStore.get(ip);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = Date.now();
  } else {
    geoStore.set(ip, { ip, country, region, city, count: 1, lastSeen: Date.now() });
  }
}

export function getGeoEntries(): GeoEntry[] {
  return Array.from(geoStore.values());
}

export function clearGeoEntries(): void {
  geoStore.clear();
}

export function computeGeoStats(records: RouteRecord[]): GeoStats {
  const entries = getGeoEntries();
  const byCountry: Record<string, number> = {};
  const byCity: Record<string, number> = {};

  for (const entry of entries) {
    byCountry[entry.country] = (byCountry[entry.country] ?? 0) + entry.count;
    const cityKey = `${entry.city}, ${entry.country}`;
    byCity[cityKey] = (byCity[cityKey] ?? 0) + entry.count;
  }

  const topIps = entries
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ ip, count }) => ({ ip, count }));

  return {
    totalUnique: geoStore.size,
    byCountry,
    byCity,
    topIps,
    entries,
  };
}
