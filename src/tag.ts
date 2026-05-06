import { RouteRecord } from './types';

export interface TagMap {
  [tag: string]: string[];
}

/**
 * Assigns tags to route records based on user-defined pattern rules.
 * Each rule maps a tag name to a regex pattern matched against `method:path`.
 */
export function applyTags(
  records: RouteRecord[],
  tagMap: TagMap
): (RouteRecord & { tags: string[] })[] {
  return records.map((record) => {
    const key = `${record.method}:${record.path}`;
    const tags: string[] = [];

    for (const [tag, pattern] of Object.entries(tagMap)) {
      if (new RegExp(pattern).test(key)) {
        tags.push(tag);
      }
    }

    return { ...record, tags };
  });
}

/**
 * Groups tagged records by their tags.
 * Records with multiple tags appear under each tag group.
 */
export function groupByTag(
  taggedRecords: (RouteRecord & { tags: string[] })[]
): Record<string, RouteRecord[]> {
  const groups: Record<string, RouteRecord[]> = {};

  for (const record of taggedRecords) {
    const { tags, ...base } = record;
    for (const tag of tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(base as RouteRecord);
    }
    if (tags.length === 0) {
      if (!groups['untagged']) groups['untagged'] = [];
      groups['untagged'].push(base as RouteRecord);
    }
  }

  return groups;
}

/**
 * Returns all unique tags present across a set of tagged records.
 */
export function listTags(
  taggedRecords: (RouteRecord & { tags: string[] })[]
): string[] {
  const set = new Set<string>();
  for (const record of taggedRecords) {
    for (const tag of record.tags) set.add(tag);
  }
  return Array.from(set).sort();
}
