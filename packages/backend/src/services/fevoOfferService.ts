/**
 * FEVO Offer Service
 *
 * All operations go through the FEVO MCP server at /mcp, which provides
 * reliable access to the FEVO API. Direct REST calls to /api/manage/...
 * returned 404 for many endpoints (vendor agreements, manifest, event search
 * with org filter). The MCP server wraps the same API but with correct
 * internal routing.
 *
 * Auth: We still use the token manager to get JWTs via the REST login
 * endpoint (which does work). The JWT is then passed to each MCP tool call.
 */

import { randomUUID } from 'crypto';
import { getFevoTokenManager, IFevoTokenManager } from './fevoTokenManager';
import { FevoMcpClient } from './fevoMcpClient';

// ── Constants ────────────────────────────────────────────────────────────────

const TICKETING_PROVIDER_MAP: Record<number, string> = {
  0: 'None', 1: 'Provenue', 2: 'Archtics', 3: 'Ticketmaster',
  4: 'Veritix', 5: 'Paciolan', 6: 'TicketReturn', 7: 'SeatGeek',
  8: 'UrVenue', 9: 'TMHost', 10: 'FrontGate', 11: 'Gateway',
  12: 'FiniDoma', 13: 'Ingresso',
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
  private mcp: FevoMcpClient;

  constructor(baseUrl: string, tokenManager: IFevoTokenManager) {
    this.baseUrl = baseUrl;
    this.tokenManager = tokenManager;
    this.mcp = new FevoMcpClient(baseUrl);
  }

  // ── Token helper ────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    console.log('[FevoOfferService] getToken called');
    const token = await this.tokenManager.getAccessToken();
    console.log(`[FevoOfferService] getToken returned (${token ? token.length + ' chars' : 'null'})`);
    return token;
  }

  // ── Read operations (all via MCP) ───────────────────────────────────────

  async listOrganizations(filter?: string, skip?: number, take?: number): Promise<any> {
    const token = await this.getToken();
    const args: Record<string, any> = { token };
    if (filter) args.filter = filter;
    if (skip !== undefined) args.skip = skip;
    if (take !== undefined) args.take = take;
    return this.mcp.callTool('list_organizations', args);
  }

  async getOrgSettings(orgId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('get_org_settings', { token, orgId });
  }

  async getVendorAgreements(orgId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('get_vendor_agreements', { token, orgId });
  }

  async searchEvents(
    orgId: string,
    query?: string,
    fromDate?: string,
    toDate?: string,
    page?: number,
    pageSize?: number,
  ): Promise<any> {
    const token = await this.getToken();
    const args: Record<string, any> = { token, organizationId: orgId };
    if (query) args.query = query;
    if (fromDate) args.fromDate = fromDate;
    if (toDate) args.toDate = toDate;
    if (page) args.page = page;
    if (pageSize) args.pageSize = pageSize;
    return this.mcp.callTool('search_events', args);
  }

  async getManifest(eventId: string, saleType?: string): Promise<any> {
    const token = await this.getToken();
    const args: Record<string, any> = { token, eventId };
    if (saleType) args.saleType = saleType;
    return this.mcp.callTool('get_manifest', args);
  }

  async listEventOffers(eventId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('list_event_offers', { token, eventId });
  }

  async listGroups(orgId: string, filter?: string): Promise<any> {
    const token = await this.getToken();
    const args: Record<string, any> = { token, orgId };
    if (filter) args.filter = filter;
    return this.mcp.callTool('list_groups', args);
  }

  async getGroupOverview(groupId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('get_group_overview', { token, groupId });
  }

  async getOfferDetails(offerId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('get_offer_details', { token, offerId });
  }

  /** For debug endpoint backwards compat */
  async getRawEventOverviews(): Promise<any> {
    const token = await this.getToken();
    // Use list_organizations to get first org, then search its events
    const orgs = await this.mcp.callTool('list_organizations', { token });
    const orgList = orgs?.overviews || [];
    if (orgList.length === 0) return { overviews: [] };
    return this.mcp.callTool('search_events', {
      token,
      organizationId: orgList[0].id,
      pageSize: 10,
    });
  }

  // ── Write operations (via MCP) ──────────────────────────────────────────

  async createOffer(payload: any): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('create_offer', {
      token,
      body: JSON.stringify(payload),
    });
  }

  async pollOfferComplete(): Promise<{ success: boolean; message: string | null }> {
    const token = await this.getToken();
    const data = await this.mcp.callTool('poll_offer_complete', { token });
    return {
      success: !!data?.success,
      message: data?.message || null,
    };
  }

  async createItemLibrary(outingId: string, payload: any): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('create_item_library', {
      token,
      body: JSON.stringify(payload),
    });
  }

  async linkItemToOffer(outingId: string, itemLibraryId: string): Promise<any> {
    const token = await this.getToken();
    return this.mcp.callTool('link_item_to_offer', {
      token,
      outingId,
      itemLibraryId,
    });
  }

  // ── Orchestrated launch flow ───────────────────────────────────────────

  async launchOffer(
    params: LaunchOfferParams,
    onProgress: ProgressCallback,
  ): Promise<LaunchOfferResult> {
    const { orgId, eventId, title, description, accessCode, hasGroups } = params;
    console.log(`[FevoOfferService] launchOffer START orgId=${orgId} eventId=${eventId}`);

    // Step 1: Get org settings then vendor agreements
    onProgress('loading_org', 'Loading organization settings...');
    let orgSettings: any;
    let vendorAgreements: any[] = [];
    try {
      console.log('[FevoOfferService] calling getOrgSettings...');
      orgSettings = await this.getOrgSettings(orgId);
      console.log('[FevoOfferService] Org settings loaded');
      onProgress('loading_vas', 'Loading vendor agreements...');
      console.log('[FevoOfferService] calling getVendorAgreements...');
      vendorAgreements = await this.getVendorAgreements(orgId);
      console.log(`[FevoOfferService] ${vendorAgreements?.length || 0} VAs loaded`);
    } catch (err: any) {
      console.error('[FevoOfferService] Failed to load org settings/VAs:', err.message);
      throw new Error(`Failed to load organization settings: ${err.message}`);
    }
    onProgress('org_loaded', 'Organization settings loaded');

    // Step 2: Get event details + manifest
    onProgress('loading_manifest', 'Loading event manifest...');
    let manifest: any = { areas: [], holds: [] };
    try {
      manifest = await this.getManifest(eventId);
      console.log(`[FevoOfferService] Manifest: ${manifest?.areas?.length || 0} areas, ${manifest?.holds?.length || 0} holds`);
    } catch (err: any) {
      console.warn('[FevoOfferService] Manifest not available (non-fatal):', err.message);
    }
    onProgress('manifest_loaded', `Manifest: ${manifest?.areas?.length || 0} areas`);

    // Step 3: Get event info for the offer payload
    onProgress('loading_event', 'Loading event details...');
    let eventInfo: any = null;
    try {
      const eventsResult = await this.searchEvents(orgId);
      const events = eventsResult?.overviews || [];
      eventInfo = events.find((e: any) => e.id === eventId) || events[0];
      console.log(`[FevoOfferService] Event info: ${eventInfo?.title || eventInfo?.venue?.name || eventId}`);
    } catch (err: any) {
      console.warn('[FevoOfferService] Event lookup failed (non-fatal):', err.message);
    }
    onProgress('event_loaded', eventInfo ? `Event: ${eventInfo.title || eventInfo.venue?.name || eventId}` : 'Event details loaded');

    // Step 4: Get template offer (if existing offers on any event)
    onProgress('loading_template', 'Looking for template offer...');
    let templateOffer: any = null;
    try {
      // Try to find an existing offer to use as template
      const eventOffers = await this.listEventOffers(eventId);
      const offerList = Array.isArray(eventOffers) ? eventOffers : [];
      if (offerList.length > 0) {
        templateOffer = await this.getOfferDetails(offerList[0].id);
        console.log(`[FevoOfferService] Template offer found: ${templateOffer?.title}`);
      }
    } catch (err: any) {
      console.warn('[FevoOfferService] No template offer found (non-fatal):', err.message);
    }
    onProgress('template_loaded', templateOffer ? `Template: ${templateOffer.title}` : 'No template (creating from defaults)');

    // Step 5: Get group (if applicable)
    let group: any = null;
    if (hasGroups) {
      onProgress('loading_groups', 'Loading groups...');
      try {
        const groupsData = await this.listGroups(orgId);
        const groups = groupsData?.overviews || [];
        if (Array.isArray(groups) && groups.length > 0) {
          group = await this.getGroupOverview(String(groups[0].id));
        }
      } catch (err: any) {
        console.warn('[FevoOfferService] Groups load failed (non-fatal):', err.message);
      }
      onProgress('groups_loaded', group ? `Group: ${group.name || group.id}` : 'No groups found');
    }

    // Step 6: Pre-generate outing UUID
    const outingId = randomUUID();
    onProgress('id_generated', `Offer ID: ${outingId}`);

    // Step 7: Build + create offer
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
        vendorAgreements: vendorAgreements || [],
        manifest,
        group,
        eventInfo,
        templateOffer,
      });
      console.log('[FevoOfferService] Offer payload built, submitting...');
      await this.createOffer(offerPayload);
    } catch (err: any) {
      console.error('[FevoOfferService] Failed to create offer:', err.message);
      throw new Error(`Failed to create offer: ${err.message}`);
    }
    onProgress('offer_created', 'Offer creation initiated');

    // Step 8: Poll for completion
    onProgress('polling', 'Waiting for offer creation to complete...');
    const pollResult = await this.pollUntilComplete(60, 3000, onProgress);
    // poll_offer_complete: success:true + message:null = success, success:true + message = error
    if (!pollResult.success) {
      throw new Error(`Offer creation failed: ${pollResult.message || 'Timed out'}`);
    }
    if (pollResult.message) {
      throw new Error(`Offer creation error: ${pollResult.message}`);
    }
    onProgress('offer_complete', 'Offer creation complete');

    // Step 9: Create item library (two-step upsert)
    let itemLibraryId: string | null = null;
    if (manifest?.areas?.length > 0) {
      try {
        onProgress('creating_item_library', 'Setting up inventory...');
        const itemPayload = this.buildItemLibraryPayload(
          manifest, orgSettings, vendorAgreements, null,
        );
        const step1Result = await this.createItemLibrary(outingId, itemPayload);

        // Extract item library ID and item IDs from step 1 response
        itemLibraryId = step1Result?.id;
        const returnedItems = step1Result?.items || [];
        console.log(`[FevoOfferService] Item library step 1 done, id: ${itemLibraryId}, items: ${returnedItems.length}`);

        if (itemLibraryId && returnedItems.length > 0) {
          // Step 2: Upsert with assigned IDs
          const upsertPayload = this.buildItemLibraryUpsertPayload(
            itemPayload, itemLibraryId, returnedItems,
          );
          await this.createItemLibrary(outingId, upsertPayload);
          console.log('[FevoOfferService] Item library step 2 (upsert) done');
        }
      } catch (err: any) {
        console.warn('[FevoOfferService] Item library creation failed (non-fatal):', err.message);
      }
    }

    // Step 10: Link item library to offer
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

    return { outingId, accessCode, manageUrl };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async pollUntilComplete(
    maxAttempts: number,
    intervalMs: number,
    onProgress: ProgressCallback,
  ): Promise<{ success: boolean; message: string | null }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const result = await this.pollOfferComplete();
        // success:false + "Running" = still in progress
        // success:true + null = completed successfully
        // success:true + message = completed with error
        if (result.success) {
          return result;
        }
        onProgress('polling', `Attempt ${attempt}/${maxAttempts}...`);
      } catch (err: any) {
        onProgress('polling', `Attempt ${attempt}/${maxAttempts} (retry: ${err.message})`);
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
    vendorAgreements: any[];
    manifest: any;
    group: any;
    eventInfo: any;
    templateOffer: any;
  }): any {
    const {
      outingId, eventId, orgId, title, description, accessCode,
      orgSettings, vendorAgreements, manifest, group, eventInfo, templateOffer,
    } = opts;

    const ticketingProvider = orgSettings?.ticketing_provider_config?.ticketing_provider ?? orgSettings?.ticketing_provider ?? 0;
    const ticketingProviderName = TICKETING_PROVIDER_MAP[ticketingProvider] || 'None';

    // Clone vendor agreements for the offer
    const clonedVAs = this.cloneVendorAgreements(vendorAgreements, outingId);

    // Build deliveries from org defaults
    const deliveries = (orgSettings?.deliveries_default || []).map((d: any) => {
      const clone = { ...d };
      delete clone.id;
      return clone;
    });

    // Build event object (stripped shape required by create_offer)
    const eventObj = this.buildEventObject(eventId, eventInfo, orgSettings, ticketingProvider);

    // Determine deadline from event date_time
    const deadline = this.buildDeadline(eventInfo);

    // Start with template if available, then override specific fields
    let offer: any;
    if (templateOffer) {
      offer = { ...templateOffer };
      // Override with our values
      offer.id = outingId;
      offer.is_create = true;
      offer.title = title;
      offer.description = description;
      offer.access_code = accessCode;
      offer.event = eventObj;
      offer.deadline = deadline;
      offer.offer_vendor_agreement = clonedVAs;
      offer.deliveries = deliveries;
      if (group) offer.group = group;
    } else {
      // Build from scratch using org defaults
      offer = {
        id: outingId,
        is_create: true,
        title,
        description,
        access_code: accessCode,
        reason: 0, // Outing
        ticket_types: 2, // OpenInventory
        type: 1,
        inventory_source: 1,
        new_inventory_management_flow: true,
        delay_delivery_fulfillment_status: 0,
        allow_all_in_fees: false,
        show_on_group_page: true,
        ticket_sort: 0,
        org_image_option: 1,
        seat_location_display: 1,
        restrict_offer: 1,
        lock_email_address_editing: true,
        is_date_time_tba: eventInfo?.is_date_time_tba ?? false,
        is_deadline_tba: eventInfo?.is_date_time_tba ?? false,
        questions: null,
        allow_show_purchased_override: null,
        social_sharing_link_enabled: false,
        code_entry_placeholder: 'Enter Discount Code',
        landing_quantity_filter: 2,
        tickets: [],
        ticketing_config: {},
        discounts: [],
        add_ons: [],
        add_on_options: [],
        promotion_codes: [],
        discount_white_list: [],
        promotion_white_list: [],

        // Org defaults
        action_button_color: orgSettings?.action_button_color_default,
        action_button_text_color: orgSettings?.action_button_text_color_default,
        display_mode: orgSettings?.display_mode_default,
        panel_view_default: orgSettings?.panel_view_default,
        toggle_settings: orgSettings?.toggle_settings,
        allianz_enabled: orgSettings?.allianz_enabled,
        shift4_payment_enabled: orgSettings?.shift4_payment_enabled,
        travel_leisure_link_enabled: orgSettings?.travel_leisure_link_enabled,
        zip_payment_enabled: orgSettings?.zip_payment_enabled,
        seat_selection_type: orgSettings?.seat_selection_type,
        page_access: orgSettings?.page_access_default,

        // Required objects
        event: eventObj,
        deadline,
        ticketing_provider_config: {
          ticketing_provider: ticketingProvider,
          add_ons: [],
          rate_limit_setting: 0,
        },
        contact: {
          name: orgSettings?.name || 'Event Contact',
          email: '',
          phone: '',
        },
        offer_vendor_agreement: clonedVAs,
        deliveries,
        group: group || null,
      };
    }

    return { offers: [offer], tiers: [] };
  }

  private buildEventObject(eventId: string, eventInfo: any, orgSettings: any, ticketingProvider: number): any {
    const dt = eventInfo?.date_time || {};
    return {
      id: eventId,
      title: eventInfo?.title || eventInfo?.venue?.name || 'Event',
      date_time: {
        hour: dt.hour ?? 19,
        minute: dt.minute ?? 0,
        second: dt.second ?? 0,
        offset: dt.offset ?? '-05:00:00',
        timezone: dt.timezone ?? eventInfo?.timezone ?? orgSettings?.timezone_default ?? 'America/New_York',
        year: dt.year ?? new Date().getFullYear(),
        month: dt.month ?? new Date().getMonth() + 1,
        day: dt.day ?? new Date().getDate(),
      },
      ticketing_provider_config: {
        ticketing_provider: ticketingProvider,
        has_event_id: true,
        event_name: eventInfo?.title || eventInfo?.venue?.name || 'Event',
        entity_type: 'Event',
        has_complete_oi_config: true,
      },
      venue: {
        id: eventInfo?.venue?.id ?? null,
        name: eventInfo?.venue?.name ?? 'Venue',
        timezone: eventInfo?.venue?.timezone ?? eventInfo?.timezone ?? orgSettings?.timezone_default ?? 'America/New_York',
      },
      is_date_time_tba: eventInfo?.is_date_time_tba ?? false,
      organization: { id: eventInfo?.organization?.id ?? orgSettings?.id ?? '' },
      merchandise_media: null,
      merchandise_image: null,
    };
  }

  private buildDeadline(eventInfo: any): any {
    const dt = eventInfo?.date_time || {};
    return {
      year: dt.year ?? new Date().getFullYear(),
      month: dt.month ?? new Date().getMonth() + 1,
      day: dt.day ?? new Date().getDate(),
      hour: dt.hour ?? 19,
      minute: dt.minute ?? 0,
      second: 0,
      offset: dt.offset ?? '-05:00:00',
      timezone: dt.timezone ?? 'America/New_York',
    };
  }

  private cloneVendorAgreements(vendorAgreements: any[], outingId: string): any[] {
    if (!Array.isArray(vendorAgreements)) return [];
    return vendorAgreements.map((va: any) => {
      const clone = { ...va };
      clone.id = randomUUID(); // New UUID for the offer VA
      clone.owner_id = outingId;
      // Strip IDs from fee entries
      const fees = clone.fees || {};
      for (const feeKey of ['at_account_receivable', 'at_checkout', 'at_payout']) {
        if (Array.isArray(fees[feeKey])) {
          fees[feeKey] = fees[feeKey].map((entry: any) => {
            const e = { ...entry };
            delete e.id;
            return e;
          });
        }
      }
      clone.fees = fees;
      return clone;
    });
  }

  private buildItemLibraryPayload(
    manifest: any,
    orgSettings: any,
    vendorAgreements: any[],
    itemLibraryId: string | null,
  ): any {
    const areas = manifest?.areas || [];
    const holds = manifest?.holds || [];
    const ticketingProvider = orgSettings?.ticketing_provider_config?.ticketing_provider ?? orgSettings?.ticketing_provider ?? 0;
    const ticketingProviderName = TICKETING_PROVIDER_MAP[ticketingProvider] || 'None';

    // Find best VA for item library: prefer type=5 (Custom), fall back to type=2 (Open Inventory)
    let bestVaId = '';
    const customVa = vendorAgreements.find((va: any) => va.type === 5);
    const openVa = vendorAgreements.find((va: any) => va.type === 2);
    bestVaId = customVa?.id || openVa?.id || (vendorAgreements[0]?.id ?? '');

    // Create one item per area+buyer combination
    const items: any[] = [];
    for (const area of areas) {
      const buyers = area.buyers || [];
      const areaSections = area.sections || [];
      const sectionConfigs = areaSections.map((sec: any, idx: number) => ({
        id: sec.id,
        condition_sort_order: idx,
      }));

      for (const buyer of buyers) {
        items.push({
          id: null,
          name: `${area.name || 'Area'} - ${buyer.name || 'Buyer'}`,
          sort_order: 0,
          timestamp: Date.now(),
          costco_context: { program_id: '', program_title: '' },
          data: {
            TicketingProvider: ticketingProviderName,
            RateLimitSetting: 0,
            EntityType: 'Outing',
            AreaBuyers: [{
              item_id: null,
              area: area.id,
              buyer: buyer.id,
              name: area.name || 'Area',
              buyer_name_origin: buyer.name || 'Buyer',
              amount_to_group: 0.0,
              vendor_agreement_id: bestVaId,
              taxable: true,
              sections: [],
              section_configs: sectionConfigs,
              sections_ga_displayed: [],
              secondary_buyers: [],
            }],
            Holds: holds.map((h: any) => h.id),
          },
        });
      }
    }

    return {
      id: itemLibraryId,
      name: 'Inventory',
      items,
    };
  }

  private buildItemLibraryUpsertPayload(
    originalPayload: any,
    itemLibraryId: string,
    returnedItems: any[],
  ): any {
    // Map original items to returned items by index, set assigned IDs
    const upsertItems = originalPayload.items.map((item: any, idx: number) => {
      const returned = returnedItems[idx];
      if (!returned) return item;

      const updatedItem = { ...item, id: returned.id };
      // Set item_id on each AreaBuyer to the parent item's ID
      if (updatedItem.data?.AreaBuyers) {
        updatedItem.data = { ...updatedItem.data };
        updatedItem.data.AreaBuyers = updatedItem.data.AreaBuyers.map((ab: any) => ({
          ...ab,
          item_id: returned.id,
        }));
      }
      return updatedItem;
    });

    return {
      id: itemLibraryId,
      name: originalPayload.name,
      items: upsertItems,
    };
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
    console.log('[FevoOfferService] Configured with MCP + JWT auth');
    return serviceInstance;
  }

  console.warn('[FevoOfferService] Not configured (missing FEVO_API_BASE_URL or credentials)');
  return null;
}

export function resetFevoOfferService(): void {
  serviceInstance = null;
}
