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
    // The VA REST endpoint is not discoverable via standard paths.
    // The MCP server uses an internal route. Try known paths, return [] if all fail.
    const paths = [
      `/api/manage/vendoragreement/${encodeURIComponent(orgId)}`,
      `/api/manage/vendoragreement?organizationId=${encodeURIComponent(orgId)}`,
      `/api/manage/organization/${encodeURIComponent(orgId)}/vendor-agreements`,
    ];

    for (const path of paths) {
      try {
        const result = await this.authenticatedGet(path);
        console.log(`[FevoOfferService] VA path worked: ${path}`);
        return result;
      } catch {
        // Try next
      }
    }

    console.warn('[FevoOfferService] All VA paths failed, returning empty (will use org defaults)');
    return [];
  }

  /** Raw event overviews (no org filter) for debugging */
  async getRawEventOverviews(): Promise<any> {
    return this.authenticatedGet('/api/manage/event/overviews?page=1&pageSize=10');
  }

  async searchEvents(
    orgId: string,
    query?: string,
    _fromDate?: string,
    _toDate?: string,
    _page = 1,
    pageSize = 100,
  ): Promise<any> {
    // Fetch events and filter by organization.id (REST API returns all orgs' events).
    // Events don't have a `title` field — they have `venue.name` and `organization.name`.
    const allOrgEvents: any[] = [];

    // Scan up to 3 pages to find events for this org
    for (let page = 1; page <= 3; page++) {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query && page === 1) params.set('filter', query);

      console.log(`[FevoOfferService] searchEvents page ${page}: /api/manage/event/overviews?${params}`);
      const result = await this.authenticatedGet(`/api/manage/event/overviews?${params}`);
      const events = result?.overviews || [];

      for (const e of events) {
        if (e.organization?.id === orgId) {
          allOrgEvents.push(e);
        }
      }

      console.log(`[FevoOfferService] Page ${page}: ${events.length} total, ${allOrgEvents.length} matching org`);

      // Stop if we found events or ran out of results
      if (allOrgEvents.length > 0 || events.length < pageSize) break;
    }

    // If text filter found nothing for this org, retry without filter
    if (allOrgEvents.length === 0 && query) {
      console.log('[FevoOfferService] searchEvents: retrying without text filter...');
      return this.searchEvents(orgId, undefined);
    }

    return { overviews: allOrgEvents, total: allOrgEvents.length };
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

    // Step 1: Get org settings + vendor agreements (parallel)
    onProgress('loading_org', 'Loading organization settings...');
    let orgSettings: any;
    let vendorAgreements: any;
    try {
      [orgSettings, vendorAgreements] = await Promise.all([
        this.getOrgSettings(orgId),
        this.getVendorAgreements(orgId),
      ]);
      console.log('[FevoOfferService] Org settings and VAs loaded successfully');
    } catch (err: any) {
      console.error('[FevoOfferService] Failed to load org settings/VAs:', err.message);
      throw new Error(`Failed to load organization settings: ${err.message}`);
    }
    onProgress('org_loaded', 'Organization settings loaded');

    // Step 2: Get manifest (non-fatal — many events don't have one)
    onProgress('loading_manifest', 'Loading event manifest...');
    let manifest: any = { areas: [], holds: [] };
    try {
      manifest = await this.getManifest(eventId);
      console.log('[FevoOfferService] Manifest loaded:', JSON.stringify(manifest).slice(0, 200));
    } catch (err: any) {
      console.warn('[FevoOfferService] Manifest not available (non-fatal):', err.message);
    }
    onProgress('manifest_loaded', 'Manifest loaded');

    // Step 3: Get group (if applicable)
    let group: any = null;
    if (hasGroups) {
      onProgress('loading_groups', 'Loading groups...');
      try {
        const groupsData = await this.listGroups(orgId);
        const groups = groupsData?.overviews || groupsData || [];
        if (Array.isArray(groups) && groups.length > 0) {
          group = await this.getGroupOverview(String(groups[0].id));
        }
      } catch (err: any) {
        console.warn('[FevoOfferService] Groups load failed (non-fatal):', err.message);
      }
      onProgress('groups_loaded', group ? `Group loaded: ${group.name || group.id}` : 'No groups found');
    }

    // Step 4: Pre-generate outing UUID
    const outingId = randomUUID();
    onProgress('id_generated', `Offer ID: ${outingId}`);

    // Step 5: Build + create offer
    onProgress('creating_offer', 'Creating offer...');
    try {
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
      console.log('[FevoOfferService] Offer payload built, submitting...');
      await this.createOffer(offerPayload);
    } catch (err: any) {
      console.error('[FevoOfferService] Failed to create offer:', err.message);
      throw new Error(`Failed to create offer: ${err.message}`);
    }
    onProgress('offer_created', 'Offer creation initiated');

    // Step 6: Poll for completion
    onProgress('polling', 'Waiting for offer creation to complete...');
    const pollResult = await this.pollUntilComplete(60, 3000, onProgress);
    if (!pollResult.success) {
      throw new Error(`Offer creation failed: ${pollResult.message || 'Unknown error'}`);
    }
    onProgress('offer_complete', 'Offer creation complete');

    // Step 7: Create item library (two-step upsert)
    let itemLibraryId: string | null = null;
    try {
      onProgress('creating_item_library', 'Setting up inventory...');
      const itemLibraryPayload = this.buildItemLibraryPayload(manifest, null);
      const itemLibraryResult = await this.createItemLibrary(outingId, itemLibraryPayload);
      itemLibraryId = itemLibraryResult?.id || itemLibraryResult?.item_library_id;
      console.log('[FevoOfferService] Item library step 1 done, id:', itemLibraryId);

      if (itemLibraryId) {
        const upsertPayload = this.buildItemLibraryPayload(manifest, itemLibraryId);
        await this.createItemLibrary(outingId, upsertPayload);
        console.log('[FevoOfferService] Item library step 2 (upsert) done');
      }
    } catch (err: any) {
      console.warn('[FevoOfferService] Item library creation failed (non-fatal):', err.message);
    }

    // Step 8: Link item library to offer
    if (itemLibraryId) {
      try {
        onProgress('linking', 'Linking inventory to offer...');
        await this.linkItemToOffer(outingId, itemLibraryId);
        console.log('[FevoOfferService] Item library linked');
      } catch (err: any) {
        console.warn('[FevoOfferService] Item library link failed (non-fatal):', err.message);
      }
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
    const timeout = setTimeout(() => controller.abort(), 60_000);

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
    const timeout = setTimeout(() => controller.abort(), 60_000);

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
    const timeout = setTimeout(() => controller.abort(), 60_000);

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
