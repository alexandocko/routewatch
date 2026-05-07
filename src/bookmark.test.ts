import {
  addBookmark,
  getBookmarks,
  getBookmarkById,
  removeBookmark,
  clearBookmarks,
  findBookmarksByRoute,
} from './bookmark';

function makeRouteRef(route = '/api/users', method = 'GET') {
  return { route, method };
}

beforeEach(() => {
  clearBookmarks();
});

describe('addBookmark', () => {
  it('creates a bookmark with a unique id and label', () => {
    const bm = addBookmark(makeRouteRef(), 'Watch users endpoint');
    expect(bm.id).toMatch(/^bm_/);
    expect(bm.label).toBe('Watch users endpoint');
    expect(bm.route).toBe('/api/users');
    expect(bm.method).toBe('GET');
    expect(bm.notes).toBeUndefined();
  });

  it('stores optional notes', () => {
    const bm = addBookmark(makeRouteRef(), 'Slow route', 'Investigate caching');
    expect(bm.notes).toBe('Investigate caching');
  });

  it('assigns unique ids across multiple bookmarks', () => {
    const a = addBookmark(makeRouteRef(), 'A');
    const b = addBookmark(makeRouteRef(), 'B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('getBookmarks', () => {
  it('returns all bookmarks sorted by creation time', () => {
    addBookmark(makeRouteRef('/a'), 'First');
    addBookmark(makeRouteRef('/b'), 'Second');
    const list = getBookmarks();
    expect(list).toHaveLength(2);
    expect(list[0].route).toBe('/a');
    expect(list[1].route).toBe('/b');
  });

  it('returns empty array when no bookmarks exist', () => {
    expect(getBookmarks()).toEqual([]);
  });
});

describe('getBookmarkById', () => {
  it('returns the correct bookmark', () => {
    const bm = addBookmark(makeRouteRef(), 'Test');
    expect(getBookmarkById(bm.id)).toEqual(bm);
  });

  it('returns undefined for unknown id', () => {
    expect(getBookmarkById('nope')).toBeUndefined();
  });
});

describe('removeBookmark', () => {
  it('removes an existing bookmark and returns true', () => {
    const bm = addBookmark(makeRouteRef(), 'Remove me');
    expect(removeBookmark(bm.id)).toBe(true);
    expect(getBookmarkById(bm.id)).toBeUndefined();
  });

  it('returns false for unknown id', () => {
    expect(removeBookmark('ghost')).toBe(false);
  });
});

describe('findBookmarksByRoute', () => {
  it('finds bookmarks matching route and method', () => {
    addBookmark(makeRouteRef('/api/items', 'GET'), 'Items GET');
    addBookmark(makeRouteRef('/api/items', 'POST'), 'Items POST');
    addBookmark(makeRouteRef('/api/other', 'GET'), 'Other');
    const result = findBookmarksByRoute('/api/items', 'GET');
    expect(result).toHaveLength(1);
    expect(result[0].method).toBe('GET');
  });

  it('finds all bookmarks for a route regardless of method when method omitted', () => {
    addBookmark(makeRouteRef('/api/items', 'GET'), 'A');
    addBookmark(makeRouteRef('/api/items', 'DELETE'), 'B');
    expect(findBookmarksByRoute('/api/items')).toHaveLength(2);
  });
});
