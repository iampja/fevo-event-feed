import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveGeo, _resetGeoCache } from '../resolveGeo';

function mockFetchResponse(body: unknown, ok = true) {
  return vi.fn().mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('resolveGeo', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    _resetGeoCache();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('AbortController', class {
      signal = {};
      abort = vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps a known US state to the correct city key', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'NY', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('new-york');
  });

  it('maps Massachusetts to boston', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'MA', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('boston');
  });

  it('maps Texas to houston', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'TX', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('houston');
  });

  it('maps California to los-angeles', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'CA', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('los-angeles');
  });

  it('maps Florida to miami', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'FL', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('miami');
  });

  it('maps Oregon to san-francisco', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'OR', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('san-francisco');
  });

  it('maps Illinois to chicago', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'IL', country_code: 'US' }),
    });

    const result = await resolveGeo();
    expect(result).toBe('chicago');
  });

  it('returns null for a non-US country', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'ON', country_code: 'CA' }),
    });

    const result = await resolveGeo();
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await resolveGeo();
    expect(result).toBeNull();
  });

  it('returns null on abort/timeout', async () => {
    fetchSpy.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

    const result = await resolveGeo();
    expect(result).toBeNull();
  });

  it('returns null when API responds with non-OK status', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const result = await resolveGeo();
    expect(result).toBeNull();
  });

  it('caches the result and only calls fetch once', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ region_code: 'NY', country_code: 'US' }),
    });

    const r1 = await resolveGeo();
    const r2 = await resolveGeo();

    expect(r1).toBe('new-york');
    expect(r2).toBe('new-york');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent calls', async () => {
    let resolveFetch!: (value: unknown) => void;
    fetchSpy.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const p1 = resolveGeo();
    const p2 = resolveGeo();

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ region_code: 'CA', country_code: 'US' }),
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('los-angeles');
    expect(r2).toBe('los-angeles');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
