import { applyTags, groupByTag, listTags } from './tag';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    duration: 42,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('applyTags', () => {
  it('applies a matching tag to a record', () => {
    const records = [makeRecord({ method: 'GET', path: '/api/users' })];
    const result = applyTags(records, { users: 'GET:/api/users' });
    expect(result[0].tags).toContain('users');
  });

  it('applies multiple tags when multiple patterns match', () => {
    const records = [makeRecord({ method: 'GET', path: '/api/users' })];
    const result = applyTags(records, {
      users: '/api/users',
      readonly: '^GET:',
    });
    expect(result[0].tags).toContain('users');
    expect(result[0].tags).toContain('readonly');
  });

  it('returns empty tags when no pattern matches', () => {
    const records = [makeRecord({ method: 'DELETE', path: '/api/items' })];
    const result = applyTags(records, { users: 'GET:/api/users' });
    expect(result[0].tags).toEqual([]);
  });
});

describe('groupByTag', () => {
  it('groups records under their tags', () => {
    const tagged = [
      { ...makeRecord({ path: '/api/users' }), tags: ['users'] },
      { ...makeRecord({ path: '/api/posts' }), tags: ['posts'] },
    ];
    const groups = groupByTag(tagged);
    expect(groups['users']).toHaveLength(1);
    expect(groups['posts']).toHaveLength(1);
  });

  it('places untagged records under "untagged"', () => {
    const tagged = [{ ...makeRecord(), tags: [] }];
    const groups = groupByTag(tagged);
    expect(groups['untagged']).toHaveLength(1);
  });

  it('places multi-tagged records in each group', () => {
    const tagged = [{ ...makeRecord(), tags: ['a', 'b'] }];
    const groups = groupByTag(tagged);
    expect(groups['a']).toHaveLength(1);
    expect(groups['b']).toHaveLength(1);
  });
});

describe('listTags', () => {
  it('returns sorted unique tags', () => {
    const tagged = [
      { ...makeRecord(), tags: ['beta', 'alpha'] },
      { ...makeRecord(), tags: ['alpha', 'gamma'] },
    ];
    expect(listTags(tagged)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns empty array when no tags exist', () => {
    const tagged = [{ ...makeRecord(), tags: [] }];
    expect(listTags(tagged)).toEqual([]);
  });
});
