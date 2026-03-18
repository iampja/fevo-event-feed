/**
 * FEVO JWT-Authenticated API Client
 *
 * Communicates with the FEVO staging/production API using JWT bearer tokens.
 * Fetches outings (offers) with full rich data including descriptions, images,
 * venue details, and organization info.
 */

import { getFevoTokenManager, IFevoTokenManager } from './fevoTokenManager';

// ── Types ────────────────────────────────────────────────────────────────────

/** Date/time object as returned by the FEVO API */
interface FevoDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offset?: string;
}

/** Normalized outing from the FEVO manage API */
export interface FevoOuting {
  outing_id: string;
  title: string;
  access_code: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  event_id: string;
  event_title: string;
  event_date_utc: string | null;
  event_timezone: string | null;
  venue: {
    id: string | null;
    name: string | null;
    city: string | null;
    state: string | null;
    timezone: string | null;
  };
  org: {
    id: string;
    name: string;
    logo_url: string | null;
    category: string | null;
    subcategory: string | null;
  };
}

/** Extended detail from GET /api/manage/outing/{id} */
export interface FevoOutingDetail {
  outing_id: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  media: Array<{ url: string; type: string }>;
  org_name: string | null;
  org_id: string | null;
  org_logo_url: string | null;
}

/** Organization search result from FEVO manage API */
export interface FevoOrganizationResult {
  id: string;
  name: string;
  logo_url: string | null;
  league: number;
  active_events: number;
  active_outings: number;
}

export interface VenueAddress {
  city: string | null;
  state: string | null;
}

export interface IFevoApiClient {
  fetchOutings(): Promise<FevoOuting[]>;
  fetchOutingDetail(outingId: string): Promise<FevoOutingDetail | null>;
  fetchVenueAddress(venueId: string): Promise<VenueAddress | null>;
  fetchOrgOverviews(): Promise<Array<{ id: string; name: string; league: number; active_outings: number; venues: Array<{ id: string; name: string }> }>>;
  searchOrganizations(query: string): Promise<FevoOrganizationResult[]>;
  isConfigured(): boolean;
}

// ── Test org filter ──────────────────────────────────────────────────────────

const TEST_ORG_PATTERNS = [
  /\btest\b/i,
  /\bqa\b/i,
  /\bautomation\b/i,
  /\bautomated\b/i,
  /\bsandbox\b/i,
  /\bdemo\b/i,
  /\bdon'?t\s*touch\b/i,
  /\bdo\s*not\s*touch\b/i,
  /\bbraintree\b/i,
  /\bload\s*test\b/i,
  /\bregression\b/i,
  /\bpixel\s*test\b/i,
  /^\W/,               // Starts with special char like #, *, ^, /
  /^\(/,               // Starts with (
  /^\[/,               // Starts with [
  /testorg/i,          // ducanh_testorg etc.
  /\bfevo\b/i,         // Internal FEVO orgs (FEVO Inventory, FEVO Enterprise, etc.)
  /\bdoma\b/i,         // DOMA test orgs (FINI DOMA, TM DOMA JR)
  /\btdc\b/i,          // TDC test orgs
  /\bhtest\b/i,        // htest orgs
  /\btrang/i,          // trang test orgs
  /\bstage\b/i,        // Staging orgs (Flexwork Sports - Stage)
  /\bstaging\b/i,      // Staging orgs (Resorts World Staging)
  /\bnon-integrated\b/i, // Non-integrated test orgs
  /\bclone\b/i,        // Cloned test items
  /\bconsent\b/i,      // Consent QA orgs
];

function isTestOrg(name: string): boolean {
  return TEST_ORG_PATTERNS.some((p) => p.test(name.trim()));
}

// ── League enum mapping ──────────────────────────────────────────────────────

const LEAGUE_MAP: Record<number, string> = {
  0: 'Other',
  1: 'MLB',
  2: 'NBA',
  3: 'NHL',
  4: 'MLS',
  5: 'G League',
  6: 'MiLB',
  7: 'College',
  8: 'WNBA',
  9: 'AHL',
  10: 'ECHL',
  13: 'MLS NEXT Pro',
  15: 'USL',
  17: 'PLL',
  18: 'AFL',
  19: 'AFL',
  20: 'CFL',
  22: 'Other',
  23: 'Entertainment',
  24: 'Live Entertainment',
  25: 'NFL',
  30: 'Indie Baseball',
  31: 'NASCAR',
  39: 'Music & Entertainment',
  43: 'Other',
  46: 'International',
};

export function leagueToCategory(league: number | null | undefined): string | null {
  if (league == null) return null;
  return LEAGUE_MAP[league] || 'Other';
}

// ── Date helper ──────────────────────────────────────────────────────────────

export function fevoDateTimeToISO(dt: FevoDateTime | null | undefined): string | null {
  if (!dt || !dt.year) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.year}-${pad(dt.month)}-${pad(dt.day)}T${pad(dt.hour)}:${pad(dt.minute)}:${pad(dt.second)}Z`;
}

// ── Real Client ──────────────────────────────────────────────────────────────

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class FevoApiClient implements IFevoApiClient {
  private baseUrl: string;
  private tokenManager: IFevoTokenManager;
  private orgOverviewsCache: Array<{ id: string; name: string; league: number; active_outings: number; venues: Array<{ id: string; name: string }> }> | null = null;

  constructor(baseUrl: string, tokenManager: IFevoTokenManager) {
    this.baseUrl = baseUrl;
    this.tokenManager = tokenManager;
  }

  isConfigured(): boolean {
    return true;
  }

  async fetchOutings(): Promise<FevoOuting[]> {
    const t0 = Date.now();
    const ts = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

    const DELAY_BETWEEN_FETCHES = 100;
    const allOutings: FevoOuting[] = [];
    const seenOutingIds = new Set<string>();
    const discoveredEventIds = new Set<string>();

    // ── Step 1: Account events ───────────────────────────────────────────────
    console.log(`[FevoApiClient] [${ts()}] Step 1: Fetching account events...`);
    try {
      const eventsData = await this.authenticatedGet('/api/account/events');
      const events = eventsData?.value || eventsData;
      if (Array.isArray(events)) {
        for (const item of events) {
          const eventId = item.event?.event_id || item.event?.id;
          if (eventId) discoveredEventIds.add(String(eventId));
        }
      }
      console.log(`[FevoApiClient] [${ts()}] Step 1 done: ${discoveredEventIds.size} events from account`);
    } catch (err: any) {
      console.error(`[FevoApiClient] [${ts()}] Step 1 FAILED: ${err.message}`);
    }

    // ── Step 2: Org name filter search ───────────────────────────────────────
    console.log(`[FevoApiClient] [${ts()}] Step 2: Fetching org overviews...`);
    try {
      const orgOverviews = await this.fetchOrgOverviews();
      const orgNames = orgOverviews
        .filter((o) => !isTestOrg(o.name))
        .map((o) => o.name)
        .filter(Boolean);
      console.log(`[FevoApiClient] [${ts()}] Got ${orgOverviews.length} orgs, ${orgNames.length} non-test. Searching events...`);

      const searchTerms = orgNames
        .map((n) => n.split(/\s+/).slice(0, 3).join(' ').trim())
        .filter((t) => t.length >= 3);

      const SEARCH_BATCH = 5;
      for (let i = 0; i < searchTerms.length; i += SEARCH_BATCH) {
        const batch = searchTerms.slice(i, i + SEARCH_BATCH);
        const results = await Promise.allSettled(
          batch.map((term) =>
            this.authenticatedGet(
              `/api/manage/event/overviews?page=1&pageSize=100&filter=${encodeURIComponent(term)}`,
            ),
          ),
        );
        let batchAdded = 0;
        for (const r of results) {
          if (r.status === 'rejected') {
            console.warn(`[FevoApiClient] [${ts()}] Filter search failed: ${r.reason?.message || r.reason}`);
            continue;
          }
          for (const ev of r.value?.overviews || []) {
            if (ev.outing_count > 0 && ev.id && !discoveredEventIds.has(ev.id)) {
              discoveredEventIds.add(ev.id);
              batchAdded++;
            }
          }
        }
        if (batchAdded > 0) {
          console.log(`[FevoApiClient] [${ts()}] Filter batch ${Math.floor(i / SEARCH_BATCH) + 1}: +${batchAdded} events`);
        }
      }
      console.log(`[FevoApiClient] [${ts()}] Step 2 done: ${discoveredEventIds.size} events total`);
    } catch (err: any) {
      console.error(`[FevoApiClient] [${ts()}] Step 2 FAILED: ${err.message}`);
    }

    // ── Step 3: Page scan ────────────────────────────────────────────────────
    console.log(`[FevoApiClient] [${ts()}] Step 3: Scanning event overview pages...`);
    try {
      const pageResults = await Promise.allSettled(
        [1, 2, 3].map((page) =>
          this.authenticatedGet(`/api/manage/event/overviews?page=${page}&pageSize=100`),
        ),
      );
      let pageAdded = 0;
      for (let p = 0; p < pageResults.length; p++) {
        const r = pageResults[p];
        if (r.status === 'rejected') {
          console.warn(`[FevoApiClient] [${ts()}] Page ${p + 1} failed: ${r.reason?.message || r.reason}`);
          continue;
        }
        for (const ev of r.value?.overviews || []) {
          if (ev.outing_count > 0 && ev.id && !discoveredEventIds.has(ev.id)) {
            discoveredEventIds.add(ev.id);
            pageAdded++;
          }
        }
      }
      console.log(`[FevoApiClient] [${ts()}] Step 3 done: +${pageAdded} events → ${discoveredEventIds.size} total`);
    } catch (err: any) {
      console.error(`[FevoApiClient] [${ts()}] Step 3 FAILED: ${err.message}`);
    }

    // ── Step 4: Fetch outings per event ──────────────────────────────────────
    console.log(`[FevoApiClient] [${ts()}] Step 4: Fetching outings for ${discoveredEventIds.size} events...`);
    const eventIdArr = Array.from(discoveredEventIds);
    const OUTING_BATCH = 10;
    let fetchErrors = 0;
    for (let i = 0; i < eventIdArr.length; i += OUTING_BATCH) {
      const batch = eventIdArr.slice(i, i + OUTING_BATCH);
      const results = await Promise.allSettled(
        batch.map((eid) =>
          this.authenticatedGet(`/api/manage/event/${encodeURIComponent(eid)}/outings`),
        ),
      );

      for (const r of results) {
        if (r.status === 'rejected') {
          fetchErrors++;
          continue;
        }
        if (!Array.isArray(r.value)) continue;
        for (const raw of r.value) {
          if (raw.disabled) continue;
          const outingId = String(raw.id || raw.outing_id);
          if (seenOutingIds.has(outingId)) continue;
          seenOutingIds.add(outingId);
          allOutings.push(this.normalizeManageOuting(raw));
        }
      }

      if (i + OUTING_BATCH < eventIdArr.length) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_FETCHES));
      }
    }

    console.log(`[FevoApiClient] [${ts()}] Step 4 done: ${allOutings.length} outings from ${discoveredEventIds.size} events (${fetchErrors} fetch errors)`);
    return allOutings;
  }

  async searchOrganizations(query: string): Promise<FevoOrganizationResult[]> {
    try {
      // FEVO API uses query string params for filtering on the overviews endpoint
      const params = new URLSearchParams({ skip: '0', take: '50', filter: query });
      const data = await this.authenticatedPost(
        `/api/manage/organization/overviews?${params}`,
        {},
      );

      const orgs = data?.overviews || data;
      if (!Array.isArray(orgs)) {
        console.warn('[FevoApiClient] Unexpected org search response:', typeof data);
        return [];
      }

      return orgs.map((org: any) => ({
        id: String(org.id),
        name: org.name || '',
        logo_url: org.logo_url || org.logo_image || null,
        league: org.league || 0,
        active_events: org.active_events || 0,
        active_outings: org.active_outings || 0,
      }));
    } catch (err: any) {
      console.warn(`[FevoApiClient] Org search failed: ${err.message}`);
      return [];
    }
  }

  async fetchOutingDetail(outingId: string): Promise<FevoOutingDetail | null> {
    try {
      const data = await this.authenticatedGet(`/api/manage/outing/${encodeURIComponent(outingId)}`);
      if (!data) return null;

      const media: Array<{ url: string; type: string }> = [];
      // outing_media can be a JSON string or an array
      let rawMedia = data.outing_media;
      if (typeof rawMedia === 'string') {
        try { rawMedia = JSON.parse(rawMedia); } catch { rawMedia = []; }
      }
      if (Array.isArray(rawMedia)) {
        for (const m of rawMedia) {
          if (m.media_url) {
            // media_type: 0 = image, 1 = video
            const type = m.media_type === 1 ? 'video' : 'image';
            media.push({ url: m.media_url, type });
          }
        }
      }

      // Org info from detail's event.organization (has name, unlike the outings list)
      const detailOrg = data.event?.organization || {};

      return {
        outing_id: String(data.outing_id || data.id || outingId),
        description: data.description || data.outing_description || null,
        image_url: media.find(m => m.type === 'image')?.url
          || data.event?.event_image
          || null,
        video_url: media.find(m => m.type === 'video')?.url || null,
        media,
        org_name: detailOrg.name || null,
        org_id: detailOrg.id ? String(detailOrg.id) : null,
        org_logo_url: detailOrg.logo_image || detailOrg.logo_image_url || null,
      };
    } catch (err: any) {
      console.warn(`[FevoApiClient] Failed to fetch outing detail ${outingId}: ${err.message}`);
      return null;
    }
  }

  async fetchVenueAddress(venueId: string): Promise<VenueAddress | null> {
    try {
      const data = await this.authenticatedGet(`/api/manage/venue/${encodeURIComponent(venueId)}`);
      if (!data) return null;
      const addr = data.address || {};
      return {
        city: addr.city || null,
        state: addr.state || addr.state_province || null,
      };
    } catch (err: any) {
      console.warn(`[FevoApiClient] Failed to fetch venue ${venueId}: ${err.message}`);
      return null;
    }
  }

  async fetchOrgOverviews(): Promise<Array<{ id: string; name: string; league: number; active_outings: number; venues: Array<{ id: string; name: string }> }>> {
    if (this.orgOverviewsCache) return this.orgOverviewsCache;
    try {
      const data = await this.authenticatedPost('/api/manage/organization/overviews?skip=0&take=500', {});
      const orgs = data?.overviews || data;
      if (!Array.isArray(orgs)) return [];
      this.orgOverviewsCache = orgs
        .filter((o: any) => (o.active_outings || 0) > 0)
        .map((o: any) => ({
          id: String(o.id),
          name: o.name || '',
          league: typeof o.league === 'number' ? o.league : 0,
          active_outings: o.active_outings || 0,
          venues: Array.isArray(o.venues) ? o.venues.map((v: any) => ({ id: String(v.id), name: v.name || '' })) : [],
        }));
      return this.orgOverviewsCache;
    } catch (err: any) {
      console.warn(`[FevoApiClient] Failed to fetch org overviews: ${err.message}`);
      return [];
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  /**
   * Normalize an outing from /api/manage/event/{id}/outings.
   * This format has inline event.organization, event.venue, and outing_media as JSON string.
   */
  private normalizeManageOuting(raw: any): FevoOuting {
    const event = raw.event || {};
    const venue = event.venue || raw.venue || {};
    const venueAddr = venue.address || venue.venue_address || {};
    const org = event.organization || raw.organization || {};

    // Parse outing_media (JSON string or array)
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let rawMedia = raw.outing_media;
    if (typeof rawMedia === 'string') {
      try { rawMedia = JSON.parse(rawMedia); } catch { rawMedia = []; }
    }
    if (Array.isArray(rawMedia)) {
      for (const m of rawMedia) {
        if (m.media_url && m.media_type === 0 && !imageUrl) imageUrl = m.media_url;
        if (m.media_url && m.media_type === 1 && !videoUrl) videoUrl = m.media_url;
      }
    }

    return {
      outing_id: String(raw.id || raw.outing_id),
      title: raw.title || '',
      access_code: raw.access_code || '',
      description: raw.description || null,
      image_url: imageUrl || event.event_image || null,
      video_url: videoUrl || null,
      event_id: String(event.id || ''),
      event_title: event.title || raw.title || '',
      event_date_utc: fevoDateTimeToISO(event.date_time || event.event_date_time_utc),
      event_timezone: event.timezone || venue.timezone || null,
      venue: {
        id: venue.id ? String(venue.id) : (venue.venue_id ? String(venue.venue_id) : null),
        name: venue.name || venue.venue_name || null,
        city: venueAddr.city || venue.city || venue.venue_city || null,
        state: venueAddr.state || venueAddr.state_province || venue.state || venue.venue_state || null,
        timezone: venue.timezone || venue.time_zone || event.timezone || null,
      },
      org: {
        id: String(org.id || org.organization_id || ''),
        name: org.name || org.organization_name || '',
        logo_url: org.logo_image || org.logo_image_url || org.logo_url || null,
        category: org.category || org.category_name || org.league_name || org.league || null,
        subcategory: org.subcategory || org.subcategory_name || null,
      },
    };
  }

  /** Normalize an outing from /api/account/outings (fallback format) */
  private normalizeOuting(raw: any): FevoOuting {
    const event = raw.event || {};
    const venue = event.venue || raw.venue || {};
    const venueAddr = venue.address || venue.venue_address || {};
    // Outings list has event.org (no name), detail has event.organization (with name)
    const org = event.organization || raw.organization || event.org || {};

    return {
      outing_id: String(raw.outing_id || raw.id),
      title: raw.outing_title || raw.title || '',
      access_code: raw.access_code || '',
      description: raw.description || null,
      image_url: raw.image_url || event.event_image || null,
      video_url: raw.video_url || null,
      event_id: String(event.event_id || event.id || ''),
      event_title: event.event_title || event.title || raw.outing_title || '',
      event_date_utc: fevoDateTimeToISO(event.event_date_time_utc || event.event_date_utc || event.date_time),
      event_timezone: venue.time_zone || venue.timezone || null,
      venue: {
        id: venue.venue_id ? String(venue.venue_id) : (venue.id ? String(venue.id) : null),
        name: venue.venue_name || venue.name || null,
        city: venueAddr.city || venue.city || venue.venue_city || null,
        state: venueAddr.state || venueAddr.state_province || venue.state || venue.venue_state || null,
        timezone: venue.time_zone || venue.timezone || null,
      },
      org: {
        id: String(org.organization_id || org.id || ''),
        name: org.organization_name || org.name || '',
        logo_url: org.logo_url || org.logo_image || org.logo_image_url || org.organization_logo || null,
        category: org.category || org.category_name || org.league_name || org.league || null,
        subcategory: org.subcategory || org.subcategory_name || null,
      },
    };
  }

  private async authenticatedPost(path: string, body: any, retried = false, retryCount = 0): Promise<any> {
    const token = await this.tokenManager.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': BROWSER_UA,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 401 && !retried) {
      console.log('[FevoApiClient] Got 401 on POST, re-authenticating...');
      this.tokenManager.invalidate();
      return this.authenticatedPost(path, body, true, retryCount);
    }

    if ((response.status === 429 || response.status === 403 || response.status === 503) && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 2000;
      console.warn(`[FevoApiClient] Got ${response.status} on POST, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.authenticatedPost(path, body, retried, retryCount + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`FEVO API error: ${response.status} ${response.statusText} — ${text.slice(0, 200)}`);
    }

    return response.json();
  }

  private async authenticatedGet(path: string, retried = false, retryCount = 0): Promise<any> {
    const token = await this.tokenManager.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'User-Agent': BROWSER_UA,
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Retry once on 401 by forcing re-login
    if (response.status === 401 && !retried) {
      console.log('[FevoApiClient] Got 401, re-authenticating...');
      this.tokenManager.invalidate();
      return this.authenticatedGet(path, true, retryCount);
    }

    // Retry on 429/403/503 with exponential backoff (up to 3 times)
    if ((response.status === 429 || response.status === 403 || response.status === 503) && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      console.warn(`[FevoApiClient] Got ${response.status}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.authenticatedGet(path, retried, retryCount + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`FEVO API error: ${response.status} ${response.statusText} — ${text.slice(0, 200)}`);
    }

    return response.json();
  }
}

// ── Mock Client (Development) ────────────────────────────────────────────────

export class MockFevoApiClient implements IFevoApiClient {
  isConfigured(): boolean {
    return true;
  }

  async fetchOutings(): Promise<FevoOuting[]> {
    return [
      {
        outing_id: 'mock-outing-001',
        title: 'Spring Celebration - Group Tickets',
        access_code: 'spring-celebration-grp',
        description: '<p>Join us for an unforgettable Spring Celebration Night! Group tickets available with exclusive perks.</p>',
        image_url: 'https://images.example.com/spring-celebration.jpg',
        video_url: null,
        event_id: 'mock-event-001',
        event_title: 'Spring Celebration Night',
        event_date_utc: '2026-04-15T19:00:00Z',
        event_timezone: 'America/New_York',
        venue: { id: 'mock-venue-001', name: 'Madison Square Garden', city: 'New York', state: 'NY', timezone: 'America/New_York' },
        org: { id: 'mock-org-001', name: 'MSG Entertainment', logo_url: 'https://logo.clearbit.com/msg.com', category: 'Sports', subcategory: 'Basketball' },
      },
      {
        outing_id: 'mock-outing-002',
        title: 'Fan Appreciation - VIP Package',
        access_code: 'fan-appreciation-vip',
        description: '<p>VIP package for our annual Fan Appreciation Weekend. Includes meet & greet and premium seating.</p>',
        image_url: 'https://images.example.com/fan-appreciation.jpg',
        video_url: null,
        event_id: 'mock-event-002',
        event_title: 'Fan Appreciation Weekend',
        event_date_utc: '2026-05-10T18:30:00Z',
        event_timezone: 'America/New_York',
        venue: { id: 'mock-venue-002', name: 'Barclays Center', city: 'Brooklyn', state: 'NY', timezone: 'America/New_York' },
        org: { id: 'mock-org-002', name: 'BSE Global', logo_url: 'https://logo.clearbit.com/bfriesents.com', category: 'Sports', subcategory: 'Basketball' },
      },
      {
        outing_id: 'mock-outing-003',
        title: 'Summer Kickoff - Early Bird Offer',
        access_code: 'summer-kickoff-early',
        description: '<p>Get your tickets early for the Summer Kickoff Event! Limited early bird pricing available.</p>',
        image_url: 'https://images.example.com/summer-kickoff.jpg',
        video_url: null,
        event_id: 'mock-event-003',
        event_title: 'Summer Kickoff Event',
        event_date_utc: '2026-06-01T20:00:00Z',
        event_timezone: 'America/Chicago',
        venue: { id: 'mock-venue-003', name: 'United Center', city: 'Chicago', state: 'IL', timezone: 'America/Chicago' },
        org: { id: 'mock-org-001', name: 'MSG Entertainment', logo_url: 'https://logo.clearbit.com/msg.com', category: 'Sports', subcategory: 'Basketball' },
      },
    ];
  }

  async searchOrganizations(_query: string): Promise<FevoOrganizationResult[]> {
    return [
      { id: 'mock-org-001', name: 'MSG Entertainment', logo_url: null, league: 2, active_events: 5, active_outings: 12 },
      { id: 'mock-org-002', name: 'BSE Global', logo_url: null, league: 2, active_events: 3, active_outings: 8 },
    ];
  }

  async fetchVenueAddress(_venueId: string): Promise<VenueAddress | null> {
    return { city: 'New York', state: 'NY' };
  }

  async fetchOrgOverviews(): Promise<Array<{ id: string; name: string; league: number; active_outings: number; venues: Array<{ id: string; name: string }> }>> {
    return [
      { id: 'mock-org-001', name: 'MSG Entertainment', league: 2, active_outings: 5, venues: [{ id: 'mock-venue-001', name: 'Madison Square Garden' }] },
      { id: 'mock-org-002', name: 'BSE Global', league: 2, active_outings: 3, venues: [{ id: 'mock-venue-002', name: 'Barclays Center' }] },
    ];
  }

  async fetchOutingDetail(outingId: string): Promise<FevoOutingDetail | null> {
    const details: Record<string, FevoOutingDetail> = {
      'mock-outing-001': {
        outing_id: 'mock-outing-001',
        description: '<p>Join us for an unforgettable Spring Celebration Night! Group tickets available with exclusive perks including a commemorative gift.</p>',
        image_url: 'https://images.example.com/spring-celebration.jpg',
        video_url: null,
        media: [{ url: 'https://images.example.com/spring-celebration.jpg', type: 'image' }],
        org_name: 'MSG Entertainment', org_id: 'mock-org-001', org_logo_url: null,
      },
      'mock-outing-002': {
        outing_id: 'mock-outing-002',
        description: '<p>VIP package for our annual Fan Appreciation Weekend. Includes meet & greet, premium seating, and exclusive merchandise.</p>',
        image_url: 'https://images.example.com/fan-appreciation.jpg',
        video_url: null,
        media: [{ url: 'https://images.example.com/fan-appreciation.jpg', type: 'image' }],
        org_name: 'BSE Global', org_id: 'mock-org-002', org_logo_url: null,
      },
      'mock-outing-003': {
        outing_id: 'mock-outing-003',
        description: '<p>Get your tickets early for the Summer Kickoff Event! Limited early bird pricing with group discounts.</p>',
        image_url: 'https://images.example.com/summer-kickoff.jpg',
        video_url: null,
        media: [{ url: 'https://images.example.com/summer-kickoff.jpg', type: 'image' }],
        org_name: 'MSG Entertainment', org_id: 'mock-org-001', org_logo_url: null,
      },
    };
    return details[outingId] || null;
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

let clientInstance: IFevoApiClient | null = null;

export function getFevoApiClient(): IFevoApiClient {
  if (clientInstance) return clientInstance;

  const baseUrl = process.env.FEVO_API_BASE_URL;
  const tokenManager = getFevoTokenManager();

  if (baseUrl && tokenManager) {
    clientInstance = new FevoApiClient(baseUrl, tokenManager);
    console.log('[FevoApiClient] Configured with JWT auth');
  } else {
    clientInstance = new MockFevoApiClient();
    console.log('[FevoApiClient] Using mock data (no credentials configured)');
  }

  return clientInstance;
}

/** Reset client instance (useful for testing) */
export function resetFevoApiClient(): void {
  clientInstance = null;
}
