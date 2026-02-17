import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFeed, ApiError } from '../api';
import type { WidgetConfig, FeedResponse } from '../types';

const MOCK_FEED_RESPONSE: FeedResponse = {
  data: [
    {
      offer_id: 'offer-1',
      title: 'Test Event',
      description: 'A test event',
      image_url: 'https://example.com/img.jpg',
      price: { min: 10, max: 50, currency: 'USD' },
      date: '2026-04-15T19:00:00Z',
      venue: { name: 'Test Venue', city: 'New York', state: 'NY' },
      availability: 'available',
      organization: { id: 'org-1', name: 'Test Org' },
      checkout_url: 'https://example.com/checkout',
      tags: ['music'],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  meta: { page: 1, per_page: 10, total: 1, total_pages: 1 },
  feed_updated_at: '2026-01-01T00:00:00Z',
};

describe('fetchFeed', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL building', () => {
    it('uses the default API URL when apiUrl is not provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({});

      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.pathname).toBe('/api/v1/feed');
    });

    it('uses a custom apiUrl when provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({ apiUrl: '/custom/feed' });

      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.pathname).toBe('/custom/feed');
    });

    it('appends segment as a query parameter', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({ segment: 'vip' });

      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.searchParams.get('segment')).toBe('vip');
    });

    it('appends maxCards as per_page query parameter', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({ maxCards: 5 });

      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.searchParams.get('per_page')).toBe('5');
    });

    it('includes both segment and per_page when both are provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({ segment: 'vip', maxCards: 3 });

      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.searchParams.get('segment')).toBe('vip');
      expect(calledUrl.searchParams.get('per_page')).toBe('3');
    });
  });

  describe('headers', () => {
    it('always includes Accept: application/json header', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({});

      const options = fetchSpy.mock.calls[0][1];
      expect(options.headers.Accept).toBe('application/json');
    });

    it('includes X-API-Key header when apiKey is provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({ apiKey: 'test-key-123' });

      const options = fetchSpy.mock.calls[0][1];
      expect(options.headers['X-API-Key']).toBe('test-key-123');
    });

    it('does not include X-API-Key header when apiKey is not provided', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({});

      const options = fetchSpy.mock.calls[0][1];
      expect(options.headers['X-API-Key']).toBeUndefined();
    });

    it('uses GET method and omit credentials', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      await fetchFeed({});

      const options = fetchSpy.mock.calls[0][1];
      expect(options.method).toBe('GET');
      expect(options.credentials).toBe('omit');
    });
  });

  describe('successful response', () => {
    it('returns parsed JSON data on success', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_FEED_RESPONSE),
      });

      const result = await fetchFeed({});
      expect(result).toEqual(MOCK_FEED_RESPONSE);
    });
  });

  describe('network errors', () => {
    it('throws an ApiError with NETWORK_ERROR code when fetch rejects', async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(fetchFeed({})).rejects.toThrow(ApiError);
      await expect(fetchFeed({})).rejects.toThrow(); // re-setup needed

      // Do it properly with a single call
      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      try {
        await fetchFeed({});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('Network error: unable to reach the event feed API.');
        expect(apiErr.status).toBe(0);
        expect(apiErr.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('non-OK responses', () => {
    it('throws an ApiError with status when the API returns non-OK status', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no body')),
      });

      try {
        await fetchFeed({});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('API responded with status 500');
        expect(apiErr.status).toBe(500);
        expect(apiErr.code).toBe('API_ERROR');
      }
    });

    it('uses error message from response body when available', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: { message: 'Forbidden: invalid API key' } }),
      });

      try {
        await fetchFeed({});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('Forbidden: invalid API key');
        expect(apiErr.status).toBe(403);
        expect(apiErr.code).toBe('API_ERROR');
      }
    });

    it('falls back to generic message when error body is not parseable', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      });

      try {
        await fetchFeed({});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('API responded with status 502');
        expect(apiErr.status).toBe(502);
      }
    });
  });

  describe('JSON parse errors on success response', () => {
    it('throws an ApiError with PARSE_ERROR code when response JSON is invalid', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      });

      try {
        await fetchFeed({});
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('Invalid JSON response from API.');
        expect(apiErr.status).toBe(200);
        expect(apiErr.code).toBe('PARSE_ERROR');
      }
    });
  });
});
