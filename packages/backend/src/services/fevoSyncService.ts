import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { getFevoApiClient, FevoOuting, FevoOutingDetail } from './fevoApiClient';
import { SyncLog } from '../models/types';

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

  let offersCreated = 0;
  let offersUpdated = 0;
  const errors: string[] = [];

  try {
    const outings = await client.fetchOutings();
    console.log(`[FevoSync] Fetched ${outings.length} outings`);

    // Group outings by organization
    const orgGroups = new Map<string, FevoOuting[]>();
    for (const outing of outings) {
      const orgId = outing.org.id;
      if (!orgGroups.has(orgId)) {
        orgGroups.set(orgId, []);
      }
      orgGroups.get(orgId)!.push(outing);
    }

    // Process each organization group
    for (const [fevoOrgId, orgOutings] of orgGroups) {
      try {
        const localOrgId = await findOrCreateOrganization(orgOutings[0].org);

        // Upsert each outing (manage API provides inline org/venue/media data)
        for (const outing of orgOutings) {
          try {
            const result = await upsertFevoOuting(outing, null, localOrgId);
            if (result === 'created') offersCreated++;
            else if (result === 'updated') offersUpdated++;
          } catch (err: any) {
            errors.push(`Outing ${outing.outing_id}: ${err.message}`);
          }
        }
      } catch (err: any) {
        errors.push(`Org ${fevoOrgId}: ${err.message}`);
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
    // Update name and logo if changed
    await db('organizations').where('id', org.id).update({
      name: orgData.name || org.name,
      logo_url: orgData.logo_url || org.logo_url,
      updated_at: now,
    });
    return org.id;
  }

  // Try to find by name
  org = await db('organizations').where('name', orgData.name).first();
  if (org) {
    // Link fevo_org_id and update logo
    await db('organizations').where('id', org.id).update({
      fevo_org_id: orgData.id,
      logo_url: orgData.logo_url || org.logo_url,
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
