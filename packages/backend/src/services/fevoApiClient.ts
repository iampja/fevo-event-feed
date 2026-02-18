/**
 * FEVO External API Client
 *
 * Interface for communicating with FEVO's external API at
 * /api/external/offers/{orgId}. Includes a mock implementation
 * for development when no credentials are available.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface FevoExternalOffer {
  event_id: string;
  event_title: string;
  event_date_utc: string;
  offer_id: string;
  offer_title: string;
  offer_url_code: string;
}

export interface FevoApiClientConfig {
  baseUrl: string;
  apiUserId: string;
  accessKey: string;
}

export interface IFevoApiClient {
  fetchOffers(orgId: string): Promise<FevoExternalOffer[]>;
  isConfigured(): boolean;
}

// ── Real Client ──────────────────────────────────────────────────────────────

export class FevoApiClient implements IFevoApiClient {
  private config: FevoApiClientConfig;

  constructor(config: FevoApiClientConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.apiUserId && this.config.accessKey);
  }

  async fetchOffers(orgId: string): Promise<FevoExternalOffer[]> {
    if (!this.isConfigured()) {
      throw new Error('FEVO API client is not configured. Set FEVO_API_BASE_URL, FEVO_API_USER_ID, and FEVO_API_ACCESS_KEY.');
    }

    const url = `${this.config.baseUrl}/api/external/offers/${encodeURIComponent(orgId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'GM-Api-User-ID': this.config.apiUserId,
        'GM-Api-Access-Key': this.config.accessKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FEVO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as FevoExternalOffer[];
  }
}

// ── Mock Client (Development) ────────────────────────────────────────────────

export class MockFevoApiClient implements IFevoApiClient {
  isConfigured(): boolean {
    return true;
  }

  async fetchOffers(orgId: string): Promise<FevoExternalOffer[]> {
    // Return realistic mock data for development
    return [
      {
        event_id: `mock-event-${orgId}-001`,
        event_title: 'Spring Celebration Night',
        event_date_utc: '2026-04-15T19:00:00Z',
        offer_id: `mock-offer-${orgId}-001`,
        offer_title: 'Spring Celebration - Group Tickets',
        offer_url_code: `spring-celebration-${orgId}-grp`,
      },
      {
        event_id: `mock-event-${orgId}-002`,
        event_title: 'Fan Appreciation Weekend',
        event_date_utc: '2026-05-10T18:30:00Z',
        offer_id: `mock-offer-${orgId}-002`,
        offer_title: 'Fan Appreciation - VIP Package',
        offer_url_code: `fan-appreciation-${orgId}-vip`,
      },
      {
        event_id: `mock-event-${orgId}-003`,
        event_title: 'Summer Kickoff Event',
        event_date_utc: '2026-06-01T20:00:00Z',
        offer_id: `mock-offer-${orgId}-003`,
        offer_title: 'Summer Kickoff - Early Bird Offer',
        offer_url_code: `summer-kickoff-${orgId}-early`,
      },
    ];
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

let clientInstance: IFevoApiClient | null = null;

export function getFevoApiClient(): IFevoApiClient {
  if (clientInstance) return clientInstance;

  const baseUrl = process.env.FEVO_API_BASE_URL;
  const apiUserId = process.env.FEVO_API_USER_ID;
  const accessKey = process.env.FEVO_API_ACCESS_KEY;

  if (baseUrl && apiUserId && accessKey) {
    clientInstance = new FevoApiClient({ baseUrl, apiUserId, accessKey });
    console.log('FEVO API client configured with real credentials');
  } else {
    clientInstance = new MockFevoApiClient();
    console.log('FEVO API client using mock data (no credentials configured)');
  }

  return clientInstance;
}

/** Reset client instance (useful for testing) */
export function resetFevoApiClient(): void {
  clientInstance = null;
}
