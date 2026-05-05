import { replayRequest, getReplayHistory, clearReplayHistory } from './replay';
import { RouteRecord } from './types';

function makeRecord(overrides: Partial<RouteRecord> = {}): RouteRecord {
  return {
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 42,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('replayRequest', () => {
  beforeEach(() => {
    clearReplayHistory();
    global.fetch = jest.fn();
  });

  it('records a successful replay', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      ok: true,
    });

    const record = makeRecord();
    const entry = await replayRequest(record, 'http://localhost:3000');

    expect(entry.statusCode).toBe(200);
    expect(entry.success).toBe(true);
    expect(entry.record).toEqual(record);
    expect(entry.id).toBeTruthy();
  });

  it('records a failed replay on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 500,
      ok: false,
    });

    const entry = await replayRequest(makeRecord(), 'http://localhost:3000');
    expect(entry.success).toBe(false);
    expect(entry.statusCode).toBe(500);
  });

  it('records failure on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const entry = await replayRequest(makeRecord(), 'http://localhost:3000');
    expect(entry.success).toBe(false);
    expect(entry.statusCode).toBe(0);
  });

  it('appends entries to history', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200, ok: true });

    await replayRequest(makeRecord(), 'http://localhost:3000');
    await replayRequest(makeRecord({ path: '/api/other' }), 'http://localhost:3000');

    expect(getReplayHistory()).toHaveLength(2);
  });

  it('clearReplayHistory empties history', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200, ok: true });
    await replayRequest(makeRecord(), 'http://localhost:3000');
    clearReplayHistory();
    expect(getReplayHistory()).toHaveLength(0);
  });

  it('passes correct method and headers to fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 201, ok: true });
    const record = makeRecord({ method: 'POST', path: '/api/items' });
    await replayRequest(record, 'http://localhost:3000');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/items',
      expect.objectContaining({
        method: 'POST',
        headers: { 'x-routewatch-replay': 'true' },
      })
    );
  });
});
