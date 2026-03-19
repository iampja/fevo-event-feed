/**
 * FEVO Offer Service
 *
 * Provides read and write operations for FEVO offers, including a fully
 * orchestrated "launch offer" flow that creates an offer end-to-end with
 * SSE progress reporting.
 *
 * Uses the same token manager pattern as FevoApiClient but with its own
 * authenticated request methods so we don't need to modify the existing
 * private methods on FevoApiClient.
 */

import { randomUUID } from 'crypto';
import { getFevoTokenManager, IFevoTokenManager } from './fevoTokenManager';

// ── Constants ────────────────────────────────────────────────────────────────

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const TICKETING_PROVIDER_MAP: Record<number, string> = {
  0: 'None',
  1: 'Provenue',
  2: 'Archtics',
  3: 'Ticketmaster',
  4: 'Veritix',
  5: 'Paciolan',
  6: 'TicketReturn',
  7: 'SeatGeek',
  8: 'UrVenue',
  9: 'TMHost',
  10: 'FrontGate',
  11: 'Gateway',
  12: 'FiniDoma',
  13: 'Ingresso',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface LaunchOfferParams {
  orgId: string;
  eventId: string;
  title: string;
  description: string;
  accessCode: string;
  hasGroups: boolean;
}

export interface LaunchOfferResult {
  outingId: string;
  accessCode: string;
  manageUrl: string;
}

type ProgressCallback = (step: string, detail?: string) => void;

// ── Service ──────────────────────────────────────────────────────────────────

export class FevoOfferService {
  private baseUrl: string;
  private tokenManager: IFevoTokenManager;

  constructor(baseUrl: string, tokenManager: IFevoTokenManager) {
    this.baseUrl = baseUrl;
    this.tokenManager = tokenManager;
  }

  // ── Read operations ──────────────────────────────────────────────────────

  async listOrganizations(filter?: string, skip = 0, take = 500): Promise<any> {
    const params = new URLSearchParams({
      skip: String(skip),
      take: String(take),
    });
    if (filter) params.set('filter', filter);
    return this.authenticatedPost(`/api/manage/organization/overviews?${params}`, {});
  }

  async getOrgSettings(orgId: string): Promise<any> {
    return this.authenticatedGet(`/api/manage/organization/${encodeURIComponent(orgId)}`);
  }

  async getVendorAgreements(orgId: string): Promise<any> {
    return this.authenticatedGet(
      `/api/manage/organization/${encodeURIComponent(orgId)}/vendor-agreements`,
    );
  }

  async searchEvents(
    orgId: string,
    query?: string,
    fromDate?: string,
    toDate?: string,
    page = 1,
    pageSize = 100,
  ): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      organizationId: orgId,
    });
    if (query) params.set('filter', query);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    return this.authenticatedGet(`/api/manage/event/overviews?${params}`);
  }

  async getManifest(eventId: string, saleType?: string): Promise<any> {
    let path = `/api/manage/event/${encodeURIComponent(eventId)}/manifest`;
    if (saleType) path += `?saleType=${encodeURIComponent(saleType)}`;
    return this.authenticatedGet(path);
  }

  async listEventOffers(eventId: string): Promise<any> {
    return this.authenticatedGet(
      `/api/manage/event/${encodeURIComponent(eventId)}/outings`,
    );
  }

  async listGroups(orgId: string, filter?: string): Promise<any> {
    const params = new URLSearchParams({
      organizationId: orgId,
      skip: '0',
      take: '50',
    });
    if (filter) params.set('filter', filter);
    return this.authenticatedPost(`/api/manage/group/overviews?${params}`, {});
  }

  async getGroupOverview(groupId: string): Promise<any> {
    return this.authenticatedGet(`/api/manage/group/${encodeURIComponent(groupId)}`);
  }

  // ── Write operations ─────────────────────────────────────────────────────

  async createOffer(payload: any): Promise<any> {
    return this.authenticatedPost('/api/manage/outing/bulk', payload);
  }

  async pollOfferComplete(): Promise<{ success: boolean; message: string | null }> {
    const data = await this.authenticatedGet('/api/manage/outing/bulk/complete');
    return {
      success: !!data?.success || data?.is_complete === true,
      message: data?.message || data?.error || null,
    };
  }

  async createItemLibrary(outingId: string, payload: any): Promise<any> {
    return this.authenticatedPost(
      `/api/manage/outing/${encodeURIComponent(outingId)}/item-library`,
      payload,
    );
  }

  async linkItemToOffer(outingId: string, itemLibraryId: string): Promise<any> {
    return this.authenticatedPut(
      `/api/manage/outing/${encodeURIComponent(outingId)}/item-library/${encodeURIComponent(itemLibraryId)}`,
      {},
    );
  }

  // ── Orchestrated launch flow ─────────────────────────────────────────────

  async launchOffer(
    params: LaunchOfferParams,
    onProgress: ProgressCallback,
  ): Promise<LaunchOfferResult> {
    const { orgId, eventId, title, description, accessCode, hasGroups } = params;

    // Step 1: Search for matching event
    onProgress('searching', 'Finding event...');
    const eventData = await this.searchEvents(orgId, undefined, undefined, undefined, 1, 100);
    const events = eventData?.overviews || [];
    const matchedEvent = events.find((e: any) => String(e.id) === eventId);
    if (!matchedEvent) {
      throw new Error(`Event ${eventId} not found in organization ${orgId}`);
    }
    onProgress('event_found', `Found event: ${matchedEvent.title || eventId}`);

    // Step 2: Get org settings + vendor agreements (parallel)
    onProgress('loading_org', 'Loading organization settings and vendor agreements...');
    const [orgSettings, vendorAgreements] = await Promise.all([
      this.getOrgSettings(orgId),
      this.getVendorAgreements(orgId),
    ]);
    onProgress('org_loaded', 'Organization settings loaded');

    // Step 3: Get manifest
    onProgress('loading_manifest', 'Loading event manifest...');
    const manifest = await this.getManifest(eventId);
    onProgress('manifest_loaded', 'Manifest loaded');

    // Step 4: Get group (if applicable)
    let group: any = null;
    if (hasGroups) {
      onProgress('loading_groups', 'Loading groups...');
      const groupsData = await this.listGroups(orgId);
      const groups = groupsData?.overviews || groupsData || [];
      if (Array.isArray(groups) && groups.length > 0) {
        group = await this.getGroupOverview(String(groups[0].id));
      }
      onProgress('groups_loaded', group ? `Group loaded: ${group.name || group.id}` : 'No groups found');
    }

    // Step 5: Pre-generate outing UUID
    onProgress('generating_id', 'Generating offer ID...');
    const outingId = randomUUID();
    onProgress('id_generated', `Offer ID: ${outingId}`);

    // Step 6: Build offer payload
    onProgress('building_payload', 'Building offer payload...');
    const offerPayload = this.buildOfferPayload({
      outingId,
      eventId,
      orgId,
      title,
      description,
      accessCode,
      orgSettings,
      vendorAgreements,
      manifest,
      group,
    });
    onProgress('payload_built', 'Offer payload ready');

    // Step 7: Create offer via bulk endpoint
    onProgress('creating_offer', 'Creating offer...');
    await this.createOffer(offerPayload);
    onProgress('offer_created', 'Offer creation initiated');

    // Step 8: Poll for completion
    onProgress('polling', 'Waiting for offer creation to complete...');
    const pollResult = await this.pollUntilComplete(60, 3000, onProgress);
    if (!pollResult.success) {
      throw new Error(`Offer creation failed: ${pollResult.message || 'Unknown error'}`);
    }
    onProgress('offer_complete', 'Offer creation complete');

    // Step 9: Create item library (step 1: null ids)
    onProgress('creating_item_library', 'Creating item library (step 1)...');
    const itemLibraryPayload = this.buildItemLibraryPayload(manifest, null);
    const itemLibraryResult = await this.createItemLibrary(outingId, itemLibraryPayload);
    const itemLibraryId = itemLibraryResult?.id || itemLibraryResult?.item_library_id;
    onProgress('item_library_created', `Item library created: ${itemLibraryId || 'unknown'}`);

    // Step 10: Create item library (step 2: upsert with returned ids)
    if (itemLibraryId) {
      onProgress('upserting_item_library', 'Upserting item library with IDs...');
      const upsertPayload = this.buildItemLibraryPayload(manifest, itemLibraryId);
      await this.createItemLibrary(outingId, upsertPayload);
      onProgress('item_library_upserted', 'Item library upserted');
    }

    // Step 11: Link item library to offer
    if (itemLibraryId) {
      onProgress('linking_item_library', 'Linking item library to offer...');
      await this.linkItemToOffer(outingId, itemLibraryId);
      onProgress('item_library_linked', 'Item library linked to offer');
    }

    const manageUrl = `${this.baseUrl}/manage/outing/${outingId}`;

    return {
      outingId,
      accessCode,
      manageUrl,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async pollUntilComplete(
    maxAttempts: number,
    intervalMs: number,
    onProgress: ProgressCallback,
  ): Promise<{ success: boolean; message: string | null }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const result = await this.pollOfferComplete();
        if (result.success) {
          return result;
        }
        onProgress('polling', `Attempt ${attempt}/${maxAttempts}...`);
      } catch (err: any) {
        // Non-fatal poll errors: keep retrying
        onProgress('polling', `Attempt ${attempt}/${maxAttempts} (error: ${err.message})`);
      }
    }
    return { success: false, message: 'Timed out waiting for offer creation to complete' };
  }

  private buildOfferPayload(opts: {
    outingId: string;
    eventId: string;
    orgId: string;
    title: string;
    description: string;
    accessCode: string;
    orgSettings: any;
    vendorAgreements: any;
    manifest: any;
    group: any;
  }): any {
    const {
      outingId,
      eventId,
      orgId,
      title,
      description,
      accessCode,
      orgSettings,
      vendorAgreements,
      manifest,
      group,
    } = opts;

    // Clone vendor agreements and strip IDs so the API creates new ones
    const clonedVAs = this.cloneVendorAgreements(vendorAgreements);

    // Build ticket types from manifest
    const ticketTypes = this.buildTicketTypes(manifest);

    // Determine ticketing provider
    const ticketingProvider = orgSettings?.ticketing_provider ?? 0;
    const ticketingProviderName =
      TICKETING_PROVIDER_MAP[ticketingProvider] || 'None';

    const offer: any = {
      id: outingId,
      event_id: eventId,
      organization_id: orgId,
      title,
      description,
      access_code: accessCode,
      ticketing_provider: ticketingProvider,
      ticketing_provider_name: ticketingProviderName,
      vendor_agreements: clonedVAs,
      ticket_types: ticketTypes,
    };

    if (group) {
      offer.group_id = group.id;
      offer.group_name = group.name;
    }

    return {
      offers: [offer],
      tiers: [],
    };
  }

  private cloneVendorAgreements(vendorAgreements: any): any[] {
    if (!vendorAgreements || !Array.isArray(vendorAgreements)) return [];
    return vendorAgreements.map((va: any) => {
      const clone = { ...va };
      // Strip IDs so the API creates new association records
      delete clone.id;
      delete clone.vendor_agreement_id;
      // Strip delivery-related IDs
      if (Array.isArray(clone.deliveries)) {
        clone.deliveries = clone.deliveries.map((d: any) => {
          const dClone = { ...d };
          delete dClone.id;
          delete dClone.delivery_id;
          return dClone;
        });
      }
      return clone;
    });
  }

  private buildTicketTypes(manifest: any): any[] {
    if (!manifest) return [];
    const sections = manifest.sections || manifest.ticket_types || [];
    if (!Array.isArray(sections)) return [];

    return sections.map((section: any) => ({
      name: section.name || section.section_name || 'General',
      price: section.price || section.face_value || 0,
      quantity: section.quantity || section.available || 0,
      section: section.section || section.section_name || null,
      row: section.row || null,
    }));
  }

  private buildItemLibraryPayload(manifest: any, itemLibraryId: string | null): any {
    const items: any[] = [];
    const sections = manifest?.sections || manifest?.ticket_types || [];

    if (Array.isArray(sections)) {
      for (const section of sections) {
        items.push({
          id: itemLibraryId ? undefined : null,
          item_library_id: itemLibraryId || null,
          name: section.name || section.section_name || 'General',
          price: section.price || section.face_value || 0,
          quantity: section.quantity || section.available || 0,
        });
      }
    }

    return {
      id: itemLibraryId || null,
      items,
    };
  }

  // ── HTTP helpers (same pattern as FevoApiClient) ─────────────────────────

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

    if (response.status === 401 && !retried) {
      console.log('[FevoOfferService] Got 401, re-authenticating...');
      this.tokenManager.invalidate();
      return this.authenticatedGet(path, true, retryCount);
    }

    if (
      (response.status === 429 || response.status === 403 || response.status === 503) &&
      retryCount < 3
    ) {
      const delay = Math.pow(2, retryCount) * 2000;
      console.warn(`[FevoOfferService] Got ${response.status}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.authenticatedGet(path, retried, retryCount + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `FEVO API error: ${response.status} ${response.statusText} — ${text.slice(0, 200)}`,
      );
    }

    return response.json();
  }

  private async authenticatedPost(
    path: string,
    body: any,
    retried = false,
    retryCount = 0,
  ): Promise<any> {
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
      console.log('[FevoOfferService] Got 401 on POST, re-authenticating...');
      this.tokenManager.invalidate();
      return this.authenticatedPost(path, body, true, retryCount);
    }

    if (
      (response.status === 429 || response.status === 403 || response.status === 503) &&
      retryCount < 3
    ) {
      const delay = Math.pow(2, retryCount) * 2000;
      console.warn(`[FevoOfferService] Got ${response.status} on POST, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.authenticatedPost(path, body, retried, retryCount + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `FEVO API error: ${response.status} ${response.statusText} — ${text.slice(0, 200)}`,
      );
    }

    return response.json();
  }

  private async authenticatedPut(
    path: string,
    body: any,
    retried = false,
    retryCount = 0,
  ): Promise<any> {
    const token = await this.tokenManager.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'PUT',
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
      console.log('[FevoOfferService] Got 401 on PUT, re-authenticating...');
      this.tokenManager.invalidate();
      return this.authenticatedPut(path, body, true, retryCount);
    }

    if (
      (response.status === 429 || response.status === 403 || response.status === 503) &&
      retryCount < 3
    ) {
      const delay = Math.pow(2, retryCount) * 2000;
      console.warn(`[FevoOfferService] Got ${response.status} on PUT, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.authenticatedPut(path, body, retried, retryCount + 1);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `FEVO API error: ${response.status} ${response.statusText} — ${text.slice(0, 200)}`,
      );
    }

    return response.json();
  }
}

// ── Singleton factory ────────────────────────────────────────────────────────

let serviceInstance: FevoOfferService | null = null;

export function getFevoOfferService(): FevoOfferService | null {
  if (serviceInstance) return serviceInstance;

  const baseUrl = process.env.FEVO_API_BASE_URL;
  const tokenManager = getFevoTokenManager();

  if (baseUrl && tokenManager) {
    serviceInstance = new FevoOfferService(baseUrl, tokenManager);
    console.log('[FevoOfferService] Configured with JWT auth');
    return serviceInstance;
  }

  console.warn('[FevoOfferService] Not configured (missing FEVO_API_BASE_URL or credentials)');
  return null;
}

export function resetFevoOfferService(): void {
  serviceInstance = null;
}
