import type { FeedResponse, WidgetConfig } from './types';

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
    url.searchParams.set('geo', config.geo);
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
