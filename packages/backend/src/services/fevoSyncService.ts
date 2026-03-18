import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import db from '../db/connection';
import { getFevoApiClient, FevoOuting, FevoOutingDetail, leagueToCategory } from './fevoApiClient';
import { SyncLog } from '../models/types';
import { startProgress, logProgress, completeProgress } from './syncProgress';

function buildCheckoutUrl(accessCode: string): string {
  const base = (process.env.FEVO_API_BASE_URL || 'https://www.gofevo.com').replace(/\/$/, '');
  return `${base}/event/${accessCode}?opencart=true`;
}

// ── Content hashing for delta detection ──────────────────────────────────────

function computeListHash(outing: FevoOuting): string {
  const parts = [
    outing.title,
    outing.description || '',
    outing.image_url || '',
    outing.video_url || '',
    outing.event_date_utc || '',
    outing.venue.name || '',
    outing.venue.city || '',
    outing.venue.state || '',
    outing.access_code || '',
    outing.org.name || '',
    outing.org.category || '',
  ];
  return createHash('md5').update(parts.join('|')).digest('hex');
}

/**
 * Sync all outings from the FEVO API (smart delta).
 *
 * 1. Fetches the full outing list (fast — single API call)
 * 2. Compares content hashes to detect new/changed outings
 * 3. Only fetches detail for new or changed outings (expensive)
 * 4. Skips unchanged outings entirely
 */
export async function syncAllOrganizations(): Promise<SyncLog[]> {
  const client = getFevoApiClient();
  const syncId = uuidv4();
  const startedAt = new Date().toISOString();

  await db('sync_log').insert({
    id: syncId,
    sync_type: 'all',
    organization_id: null,
    started_at: startedAt,
    status: 'running',
  });

  startProgress(syncId);

  let offersCreated = 0;
  let offersUpdated = 0;
  let offersSkipped = 0;
  const errors: string[] = [];

  try {
    logProgress(syncId, 'Fetching outings from FEVO API...');
    // fetchOutings() already calls fetchOrgOverviews() internally for event discovery
    const outings = await client.fetchOutings();
    logProgress(syncId, `Found ${outings.length} outings from FEVO`);

    // ── Enrich org category from org overviews (reuses cached data) ──────
    logProgress(syncId, 'Enriching org categories...');
    const orgOverviews = await client.fetchOrgOverviews();
    const orgCategoryMap = new Map<string, string | null>();
    for (const ov of orgOverviews) {
      orgCategoryMap.set(ov.id, leagueToCategory(ov.league));
    }
    for (const o of outings) {
      if (!o.org.category) {
        o.org.category = orgCategoryMap.get(o.org.id) || null;
      }
    }

    // Load existing content hashes in bulk for fast comparison
    const existingOffers = await db('offers')
      .whereNotNull('fevo_offer_id')
      .select('fevo_offer_id', 'content_hash');
    const hashMap = new Map<string, string | null>();
    for (const row of existingOffers) {
      hashMap.set(row.fevo_offer_id, row.content_hash);
    }

    // Determine which outings need processing
    const needsUpdate: FevoOuting[] = [];
    const unchanged: FevoOuting[] = [];
    for (const outing of outings) {
      const listHash = computeListHash(outing);
      const storedHash = hashMap.get(outing.outing_id);
      if (storedHash && storedHash === listHash) {
        unchanged.push(outing);
      } else {
        needsUpdate.push(outing);
      }
    }

    offersSkipped = unchanged.length;
    logProgress(syncId, `Delta check: ${needsUpdate.length} new/changed, ${offersSkipped} unchanged (skipped)`);

    if (needsUpdate.length === 0) {
      logProgress(syncId, 'Nothing to update — all offers are current');
    } else {
      // Skip individual detail fetches — the outing list data from
      // /api/manage/event/{id}/outings already includes description,
      // media, org, and venue info. This eliminates ~875 API calls.

      // Group changed outings by org and process
      const orgGroups = new Map<string, FevoOuting[]>();
      for (const outing of needsUpdate) {
        const orgId = outing.org.id;
        if (!orgGroups.has(orgId)) orgGroups.set(orgId, []);
        orgGroups.get(orgId)!.push(outing);
      }

      let orgIndex = 0;
      for (const [fevoOrgId, orgOutings] of orgGroups) {
        orgIndex++;
        try {
          const localOrgId = await findOrCreateOrganization(orgOutings[0].org);
          const orgName = orgOutings[0].org.name || fevoOrgId;
          logProgress(syncId, `[${orgIndex}/${orgGroups.size}] Processing ${orgName} (${orgOutings.length} changed)`);

          for (const outing of orgOutings) {
            try {
              const result = await upsertFevoOuting(outing, null, localOrgId);
              if (result === 'created') offersCreated++;
              else if (result === 'updated') offersUpdated++;

              // Store new content hash
              const listHash = computeListHash(outing);
              await db('offers')
                .where('fevo_offer_id', outing.outing_id)
                .update({ content_hash: listHash });
            } catch (err: any) {
              errors.push(`Outing ${outing.outing_id}: ${err.message}`);
              logProgress(syncId, `  Error: ${outing.title} — ${err.message}`);
            }
          }
        } catch (err: any) {
          errors.push(`Org ${fevoOrgId}: ${err.message}`);
          logProgress(syncId, `  Org error: ${err.message}`);
        }
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const duration = `${(durationMs / 1000).toFixed(1)}s`;
    const finalStatus = errors.length > 0 && offersCreated === 0 && offersUpdated === 0 ? 'failed' : 'completed';

    await db('sync_log').where('id', syncId).update({
      completed_at: completedAt,
      offers_created: offersCreated,
      offers_updated: offersUpdated,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
      status: finalStatus,
    });

    completeProgress(syncId, finalStatus as 'completed' | 'failed', {
      created: offersCreated,
      updated: offersUpdated,
      errors: errors.length,
      duration,
    });
  } catch (err: any) {
    errors.push(err.message);
    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    await db('sync_log').where('id', syncId).update({
      completed_at: completedAt,
      offers_created: offersCreated,
      offers_updated: offersUpdated,
      errors: JSON.stringify(errors),
      status: 'failed',
    });
    logProgress(syncId, `Fatal error: ${err.message}`);
    completeProgress(syncId, 'failed', {
      created: offersCreated,
      updated: offersUpdated,
      errors: errors.length,
      duration: `${(durationMs / 1000).toFixed(1)}s`,
    });
  }

  const logEntry = await db('sync_log').where('id', syncId).first() as SyncLog;
  return [logEntry];
}

/**
 * Sync offers for a single organization.
 */
export async function syncOrganizationOffers(orgId: string): Promise<SyncLog> {
  const client = getFevoApiClient();
  const syncId = uuidv4();
  const startedAt = new Date().toISOString();

  await db('sync_log').insert({
    id: syncId,
    sync_type: 'organization',
    organization_id: orgId,
    started_at: startedAt,
    status: 'running',
  });

  let offersCreated = 0;
  let offersUpdated = 0;
  const errors: string[] = [];

  try {
    const org = await db('organizations').where('id', orgId).first()
      || await db('organizations').where('fevo_org_id', orgId).first();

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const effectiveOrgId = org.id;
    const fevoOrgId = org.fevo_org_id;

    const outings = await client.fetchOutings();

    // Enrich with org category and venue address
    const orgOverviews = await client.fetchOrgOverviews();
    const orgCatMap = new Map<string, string | null>();
    for (const ov of orgOverviews) orgCatMap.set(ov.id, leagueToCategory(ov.league));

    const venueIdsToFetch = new Set<string>();
    for (const o of outings) {
      if (o.venue.id && !o.venue.city) venueIdsToFetch.add(o.venue.id);
    }
    const venueAddrMap = new Map<string, { city: string | null; state: string | null }>();
    for (const vid of venueIdsToFetch) {
      const addr = await client.fetchVenueAddress(vid);
      if (addr) venueAddrMap.set(vid, addr);
    }
    for (const o of outings) {
      if (!o.org.category) o.org.category = orgCatMap.get(o.org.id) || null;
      if (o.venue.id && !o.venue.city) {
        const addr = venueAddrMap.get(o.venue.id);
        if (addr) { o.venue.city = addr.city; o.venue.state = addr.state; }
      }
    }

    const orgOutings = fevoOrgId
      ? outings.filter(o => o.org.id === fevoOrgId)
      : outings.filter(o => o.org.name === org.name);

    console.log(`[FevoSync] Filtered ${orgOutings.length} outings for org ${effectiveOrgId}`);

    for (const outing of orgOutings) {
      try {
        const result = await upsertFevoOuting(outing, null, effectiveOrgId);
        if (result === 'created') offersCreated++;
        else if (result === 'updated') offersUpdated++;

        // Store content hash
        const listHash = computeListHash(outing);
        await db('offers')
          .where('fevo_offer_id', outing.outing_id)
          .update({ content_hash: listHash });
      } catch (err: any) {
        errors.push(`Outing ${outing.outing_id}: ${err.message}`);
      }
    }

    await db('sync_log').where('id', syncId).update({
      completed_at: new Date().toISOString(),
      offers_created: offersCreated,
      offers_updated: offersUpdated,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
      status: errors.length > 0 && offersCreated === 0 && offersUpdated === 0 ? 'failed' : 'completed',
    });
  } catch (err: any) {
    errors.push(err.message);
    await db('sync_log').where('id', syncId).update({
      completed_at: new Date().toISOString(),
      offers_created: offersCreated,
      offers_updated: offersUpdated,
      errors: JSON.stringify(errors),
      status: 'failed',
    });
  }

  return db('sync_log').where('id', syncId).first() as Promise<SyncLog>;
}

/**
 * Delta sync — alias for the smart sync (kept for API compatibility).
 */
export async function syncDelta(): Promise<SyncLog[]> {
  return syncAllOrganizations();
}

/**
 * Get recent sync logs with optional filtering.
 */
export async function getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
  return db('sync_log')
    .orderBy('started_at', 'desc')
    .limit(limit);
}

// ── Internal helpers ────────────────────────────────────────────────────────

async function findOrCreateOrganization(
  orgData: FevoOuting['org']
): Promise<string> {
  const now = new Date().toISOString();

  // Try to find by fevo_org_id
  let org = await db('organizations').where('fevo_org_id', orgData.id).first();
  if (org) {
    await db('organizations').where('id', org.id).update({
      name: orgData.name || org.name,
      logo_url: orgData.logo_url || org.logo_url,
      category: orgData.category || org.category,
      subcategory: orgData.subcategory || org.subcategory,
      updated_at: now,
    });
    return org.id;
  }

  // Try to find by name
  org = await db('organizations').where('name', orgData.name).first();
  if (org) {
    await db('organizations').where('id', org.id).update({
      fevo_org_id: orgData.id,
      logo_url: orgData.logo_url || org.logo_url,
      category: orgData.category || org.category,
      subcategory: orgData.subcategory || org.subcategory,
      updated_at: now,
    });
    return org.id;
  }

  // Create new organization
  const newId = uuidv4();
  await db('organizations').insert({
    id: newId,
    name: orgData.name,
    logo_url: orgData.logo_url,
    fevo_org_id: orgData.id,
    category: orgData.category,
    subcategory: orgData.subcategory,
    distribution_enabled: false,
    created_at: now,
    updated_at: now,
  });
  return newId;
}

async function upsertVenue(
  venueData: FevoOuting['venue']
): Promise<string | null> {
  if (!venueData.name) return null;
  const now = new Date().toISOString();

  if (venueData.id) {
    let venue = await db('venues').where('fevo_venue_id', venueData.id).first();
    if (venue) {
      await db('venues').where('id', venue.id).update({
        name: venueData.name,
        city: venueData.city || venue.city,
        state: venueData.state || venue.state,
        timezone: venueData.timezone || venue.timezone,
        updated_at: now,
      });
      return venue.id;
    }
  }

  let venue = await db('venues')
    .where('name', venueData.name)
    .andWhere('city', venueData.city)
    .first();
  if (venue) {
    const updates: any = { updated_at: now };
    if (venueData.id) updates.fevo_venue_id = venueData.id;
    if (venueData.state) updates.state = venueData.state;
    if (venueData.timezone) updates.timezone = venueData.timezone;
    await db('venues').where('id', venue.id).update(updates);
    return venue.id;
  }

  const newId = uuidv4();
  await db('venues').insert({
    id: newId,
    name: venueData.name,
    city: venueData.city,
    state: venueData.state,
    country: 'US',
    timezone: venueData.timezone,
    fevo_venue_id: venueData.id || null,
    created_at: now,
    updated_at: now,
  });
  return newId;
}

async function upsertEvent(
  outing: FevoOuting,
  orgId: string,
  venueId: string | null
): Promise<string> {
  const now = new Date().toISOString();

  const existing = await db('events')
    .where('fevo_event_id', outing.event_id)
    .first();

  if (existing) {
    await db('events').where('id', existing.id).update({
      title: outing.event_title,
      date_utc: outing.event_date_utc,
      date_timezone: outing.event_timezone,
      venue_id: venueId || existing.venue_id,
      updated_at: now,
    });
    return existing.id;
  }

  const newId = uuidv4();
  await db('events').insert({
    id: newId,
    title: outing.event_title,
    fevo_event_id: outing.event_id,
    organization_id: orgId,
    venue_id: venueId,
    date_utc: outing.event_date_utc,
    date_timezone: outing.event_timezone,
    created_at: now,
    updated_at: now,
  });
  return newId;
}

async function upsertFevoOuting(
  outing: FevoOuting,
  detail: FevoOutingDetail | null,
  orgId: string
): Promise<'created' | 'updated'> {
  const now = new Date().toISOString();

  const venueId = await upsertVenue(outing.venue);
  const eventId = await upsertEvent(outing, orgId, venueId);

  const description = detail?.description || outing.description || null;
  const imageUrl = detail?.image_url || outing.image_url || null;
  const videoUrl = detail?.video_url || outing.video_url || null;
  const orgName = detail?.org_name || outing.org.name || null;
  const checkoutUrl = buildCheckoutUrl(outing.access_code);

  const existing = await db('offers')
    .where('fevo_offer_id', outing.outing_id)
    .first();

  const orgRow = await db('organizations').where('id', orgId).select('category', 'subcategory').first();
  const category = orgRow?.category || outing.org.category || null;
  const subcategory = orgRow?.subcategory || outing.org.subcategory || null;

  if (existing) {
    await db('offers')
      .where('id', existing.id)
      .update({
        title: outing.title,
        description,
        image_url: imageUrl,
        video_url: videoUrl,
        date: outing.event_date_utc,
        venue_name: outing.venue.name,
        venue_city: outing.venue.city,
        venue_state: outing.venue.state,
        venue_id: venueId,
        organization_id: orgId,
        organization_name: orgName,
        category,
        subcategory,
        event_id: eventId,
        checkout_url: checkoutUrl,
        fevo_url_code: outing.access_code,
        fevo_synced_at: now,
        updated_at: now,
      });
    return 'updated';
  }

  await db('offers').insert({
    id: uuidv4(),
    title: outing.title,
    description,
    image_url: imageUrl,
    video_url: videoUrl,
    price_min: null,
    price_max: null,
    currency: 'USD',
    date: outing.event_date_utc,
    venue_name: outing.venue.name,
    venue_city: outing.venue.city,
    venue_state: outing.venue.state,
    venue_id: venueId,
    availability: 'available',
    organization_id: orgId,
    organization_name: outing.org.name,
    category,
    subcategory,
    checkout_url: checkoutUrl,
    tags: null,
    status: 'active',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    fevo_offer_id: outing.outing_id,
    fevo_url_code: outing.access_code,
    event_id: eventId,
    tickets_available: null,
    is_sold_out: false,
    source: 'fevo_sync',
    fevo_synced_at: now,
    created_at: now,
    updated_at: now,
  });
  return 'created';
}
