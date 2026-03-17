import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import db from '../db/connection';
import { getFevoApiClient, FevoOuting, FevoOutingDetail } from './fevoApiClient';
import { SyncLog } from '../models/types';
import { startProgress, logProgress, completeProgress } from './syncProgress';

function buildCheckoutUrl(accessCode: string): string {
  const base = (process.env.FEVO_API_BASE_URL || 'https://www.gofevo.com').replace(/\/$/, '');
  return `${base}/event/${accessCode}?opencart=true`;
}

/**
 * Sync all outings from the FEVO API.
 * Fetches the full outing list, enriches each with detail data,
 * groups by organization, and upserts orgs/venues/events/offers.
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
  const errors: string[] = [];

  try {
    logProgress(syncId, 'Fetching outings from FEVO API...');
    const outings = await client.fetchOutings();
    console.log(`[FevoSync] Fetched ${outings.length} outings`);
    logProgress(syncId, `Found ${outings.length} outings from FEVO`);

    // Group outings by organization
    const orgGroups = new Map<string, FevoOuting[]>();
    for (const outing of outings) {
      const orgId = outing.org.id;
      if (!orgGroups.has(orgId)) {
        orgGroups.set(orgId, []);
      }
      orgGroups.get(orgId)!.push(outing);
    }
    logProgress(syncId, `Grouped into ${orgGroups.size} organizations`);

    // Fetch all outing details concurrently (batches of 10)
    const allOutings = Array.from(orgGroups.values()).flat();
    logProgress(syncId, `Fetching detail for ${allOutings.length} outings (batches of 5)...`);
    const detailMap = new Map<string, FevoOutingDetail | null>();
    let detailsFetched = 0;
    let detailsFailed = 0;
    const BATCH_SIZE = 5;
    for (let i = 0; i < allOutings.length; i += BATCH_SIZE) {
      const batch = allOutings.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((o) => client.fetchOutingDetail(o.outing_id)),
      );
      for (let j = 0; j < batch.length; j++) {
        const r = results[j];
        if (r.status === 'fulfilled') {
          detailMap.set(batch[j].outing_id, r.value);
          detailsFetched++;
        } else {
          detailMap.set(batch[j].outing_id, null);
          detailsFailed++;
        }
      }
      if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= allOutings.length) {
        logProgress(syncId, `Detail progress: ${Math.min(i + BATCH_SIZE, allOutings.length)}/${allOutings.length} fetched`);
      }
      // Small delay between batches to avoid Cloudflare rate limiting
      if (i + BATCH_SIZE < allOutings.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    logProgress(syncId, `Details complete: ${detailsFetched} fetched, ${detailsFailed} failed`);

    // Process each organization group
    let orgIndex = 0;
    for (const [fevoOrgId, orgOutings] of orgGroups) {
      orgIndex++;
      try {
        const localOrgId = await findOrCreateOrganization(orgOutings[0].org);
        const orgName = orgOutings[0].org.name || fevoOrgId;
        logProgress(syncId, `[${orgIndex}/${orgGroups.size}] Processing ${orgName} (${orgOutings.length} outings)`);

        for (const outing of orgOutings) {
          try {
            const detail = detailMap.get(outing.outing_id) || null;
            const result = await upsertFevoOuting(outing, detail, localOrgId);
            if (result === 'created') offersCreated++;
            else if (result === 'updated') offersUpdated++;
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
      duration: `${((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000).toFixed(1)}s`,
    });
  }

  const logEntry = await db('sync_log').where('id', syncId).first() as SyncLog;
  return [logEntry];
}

/**
 * Sync offers for a single organization.
 * Internally runs the full sync and filters results to the specified org.
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
    // Look up the organization to get fevo_org_id
    const org = await db('organizations').where('id', orgId).first()
      || await db('organizations').where('fevo_org_id', orgId).first();

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const effectiveOrgId = org.id;
    const fevoOrgId = org.fevo_org_id;

    const outings = await client.fetchOutings();

    // Filter to outings belonging to this org
    const orgOutings = fevoOrgId
      ? outings.filter(o => o.org.id === fevoOrgId)
      : outings.filter(o => o.org.name === org.name);

    console.log(`[FevoSync] Filtered ${orgOutings.length} outings for org ${effectiveOrgId}`);

    for (const outing of orgOutings) {
      try {
        const detail = await client.fetchOutingDetail(outing.outing_id);
        const result = await upsertFevoOuting(outing, detail, effectiveOrgId);
        if (result === 'created') offersCreated++;
        else if (result === 'updated') offersUpdated++;
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
    // Update name, logo, and category if changed
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
    // Link fevo_org_id and update logo/category
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

  // Try to find by fevo_venue_id
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

  // Try to find by name + city
  let venue = await db('venues')
    .where('name', venueData.name)
    .andWhere('city', venueData.city)
    .first();
  if (venue) {
    // Link fevo_venue_id
    const updates: any = { updated_at: now };
    if (venueData.id) updates.fevo_venue_id = venueData.id;
    if (venueData.state) updates.state = venueData.state;
    if (venueData.timezone) updates.timezone = venueData.timezone;
    await db('venues').where('id', venue.id).update(updates);
    return venue.id;
  }

  // Create new venue
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

  // Resolve venue
  const venueId = await upsertVenue(outing.venue);

  // Resolve event
  const eventId = await upsertEvent(outing, orgId, venueId);

  // Merge description and image from detail if available
  const description = detail?.description || outing.description || null;
  const imageUrl = detail?.image_url || outing.image_url || null;
  const videoUrl = detail?.video_url || outing.video_url || null;

  // Use org name from detail (outings list doesn't include org name)
  const orgName = detail?.org_name || outing.org.name || null;

  const checkoutUrl = buildCheckoutUrl(outing.access_code);

  // Check if offer already exists by fevo_offer_id (outing_id)
  const existing = await db('offers')
    .where('fevo_offer_id', outing.outing_id)
    .first();

  // Fetch org category from the organizations table (authoritative source)
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

// ── Content hashing for delta sync ──────────────────────────────────────────

function computeContentHash(outing: FevoOuting, detail: FevoOutingDetail | null): string {
  const parts = [
    outing.title,
    detail?.description || outing.description || '',
    detail?.image_url || outing.image_url || '',
    detail?.video_url || outing.video_url || '',
    outing.event_date_utc || '',
    outing.venue.name || '',
    outing.venue.city || '',
    outing.access_code || '',
  ];
  return createHash('md5').update(parts.join('|')).digest('hex');
}

/**
 * Delta sync — only process new or changed outings.
 * Fetches the full outing list but skips upserting records whose content hash hasn't changed.
 */
export async function syncDelta(): Promise<SyncLog[]> {
  const client = getFevoApiClient();
  const syncId = uuidv4();
  const startedAt = new Date().toISOString();

  await db('sync_log').insert({
    id: syncId,
    sync_type: 'delta',
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
    logProgress(syncId, 'Delta sync: fetching outings from FEVO API...');
    const outings = await client.fetchOutings();
    logProgress(syncId, `Found ${outings.length} outings, checking for changes...`);

    // Group outings by organization
    const orgGroups = new Map<string, FevoOuting[]>();
    for (const outing of outings) {
      const orgId = outing.org.id;
      if (!orgGroups.has(orgId)) orgGroups.set(orgId, []);
      orgGroups.get(orgId)!.push(outing);
    }

    // Fetch details only for outings that are new or changed
    let orgIndex = 0;
    for (const [fevoOrgId, orgOutings] of orgGroups) {
      orgIndex++;
      try {
        const localOrgId = await findOrCreateOrganization(orgOutings[0].org);
        const orgName = orgOutings[0].org.name || fevoOrgId;
        logProgress(syncId, `[${orgIndex}/${orgGroups.size}] Processing ${orgName}`);

        for (const outing of orgOutings) {
          try {
            // Check if this outing exists and has a content hash
            const existing = await db('offers')
              .where('fevo_offer_id', outing.outing_id)
              .first();

            // Quick check: compute hash from list data only first
            const quickHash = computeContentHash(outing, null);

            if (existing && existing.content_hash === quickHash) {
              offersSkipped++;
              continue;
            }

            // Fetch detail for new or changed outings
            let detail: FevoOutingDetail | null = null;
            try {
              detail = await client.fetchOutingDetail(outing.outing_id);
            } catch {
              // Continue without detail
            }

            const fullHash = computeContentHash(outing, detail);

            // If the full hash matches, skip
            if (existing && existing.content_hash === fullHash) {
              offersSkipped++;
              continue;
            }

            const result = await upsertFevoOuting(outing, detail, localOrgId);
            if (result === 'created') offersCreated++;
            else if (result === 'updated') offersUpdated++;

            // Update content hash
            const offer = await db('offers').where('fevo_offer_id', outing.outing_id).first();
            if (offer) {
              await db('offers').where('id', offer.id).update({ content_hash: fullHash });
            }

            // Small delay to avoid rate limiting
            await new Promise((r) => setTimeout(r, 200));
          } catch (err: any) {
            errors.push(`Outing ${outing.outing_id}: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Org ${fevoOrgId}: ${err.message}`);
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
    await db('sync_log').where('id', syncId).update({
      completed_at: new Date().toISOString(),
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
      duration: '0s',
    });
  }

  const logEntry = await db('sync_log').where('id', syncId).first() as SyncLog;
  return [logEntry];
}
