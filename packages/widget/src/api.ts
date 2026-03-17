import type { FeedResponse, Offer, WidgetConfig } from './types';

const DEFAULT_API_URL = '/api/v1/event-feed';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchFeed(config: WidgetConfig): Promise<FeedResponse> {
  const baseUrl = config.apiUrl || DEFAULT_API_URL;
  const url = new URL(baseUrl, window.location.origin);

  if (config.segment) {
    url.searchParams.set('segment', config.segment);
  }
  if (config.maxCards) {
    url.searchParams.set('per_page', String(config.maxCards));
  }
  if (config.geo) {
    url.searchParams.set('geography', config.geo);
  }
  if (config.search) {
    url.searchParams.set('search', config.search);
  }
  if (config.mode === 'marketplace') {
    url.searchParams.set('mode', 'marketplace');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      credentials: 'omit',
    });
  } catch (err) {
    throw new ApiError(
      'Network error: unable to reach the event feed API.',
      0,
      'NETWORK_ERROR',
    );
  }

  if (!response.ok) {
    let errorMessage = `API responded with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error?.message) {
        errorMessage = body.error.message;
      }
    } catch {
      // ignore parse errors on error responses
    }
    throw new ApiError(errorMessage, response.status, 'API_ERROR');
  }

  let data: FeedResponse;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'Invalid JSON response from API.',
      response.status,
      'PARSE_ERROR',
    );
  }

  return data;
}

export async function fetchSegments(config: WidgetConfig): Promise<{ data: { id: string; name: string; slug: string; type: string }[] }> {
  const baseUrl = config.apiUrl || DEFAULT_API_URL;
  const url = new URL(`${baseUrl}/segments`, window.location.origin);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.apiKey) headers['X-API-Key'] = config.apiKey;
  const response = await fetch(url.toString(), { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new ApiError(`API responded with status ${response.status}`, response.status);
  return response.json();
}

export async function fetchGeographies(config: WidgetConfig): Promise<{ data: { venue_city: string; venue_state: string }[] }> {
  const baseUrl = config.apiUrl || DEFAULT_API_URL;
  const url = new URL(`${baseUrl}/geographies`, window.location.origin);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.apiKey) headers['X-API-Key'] = config.apiKey;
  const response = await fetch(url.toString(), { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new ApiError(`API responded with status ${response.status}`, response.status);
  return response.json();
}

export async function fetchOffer(config: WidgetConfig, offerId: string): Promise<{ data: Offer }> {
  const baseUrl = config.apiUrl || DEFAULT_API_URL;
  const url = new URL(`${baseUrl}/${offerId}`, window.location.origin);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.apiKey) headers['X-API-Key'] = config.apiKey;
  const response = await fetch(url.toString(), { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new ApiError(`API responded with status ${response.status}`, response.status);
  return response.json();
}
