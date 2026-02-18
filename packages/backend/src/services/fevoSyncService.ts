import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { getFevoApiClient, FevoExternalOffer } from './fevoApiClient';
import { SyncLog } from '../models/types';

const FEVO_CHECKOUT_BASE = 'https://fevo.com/edp/';

/**
 * Sync offers for a single organization from the FEVO external API.
 * Upserts offers with source='fevo_sync', creates/updates events,
 * and logs the sync operation.
 */
export async function syncOrganizationOffers(orgId: string): Promise<SyncLog> {
  const client = getFevoApiClient();
  const syncId = uuidv4();
  const startedAt = new Date().toISOString();

  // Create sync log entry
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
    const fevoOffers = await client.fetchOffers(orgId);

    // Verify the organization exists locally
    const org = await db('organizations').where('id', orgId).first();
    if (!org) {
      // Try by fevo_org_id
      const orgByFevo = await db('organizations').where('fevo_org_id', orgId).first();
      if (!orgByFevo) {
        throw new Error(`Organization not found: ${orgId}`);
      }
    }

    const effectiveOrgId = org ? org.id : (await db('organizations').where('fevo_org_id', orgId).first()).id;

    for (const fevoOffer of fevoOffers) {
      try {
        const result = await upsertFevoOffer(fevoOffer, effectiveOrgId);
        if (result === 'created') offersCreated++;
        else if (result === 'updated') offersUpdated++;
      } catch (err: any) {
        errors.push(`Offer ${fevoOffer.offer_id}: ${err.message}`);
      }
    }

    // Update sync log as completed
    const completedAt = new Date().toISOString();
    await db('sync_log').where('id', syncId).update({
      completed_at: completedAt,
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
 * Sync all configured organizations (those with fevo_org_id set).
 */
export async function syncAllOrganizations(): Promise<SyncLog[]> {
  const orgs = await db('organizations').whereNotNull('fevo_org_id');
  const results: SyncLog[] = [];

  for (const org of orgs) {
    const result = await syncOrganizationOffers(org.id);
    results.push(result);
  }

  return results;
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

async function upsertFevoOffer(
  fevoOffer: FevoExternalOffer,
  orgId: string
): Promise<'created' | 'updated'> {
  const now = new Date().toISOString();
  const checkoutUrl = `${FEVO_CHECKOUT_BASE}${fevoOffer.offer_url_code}`;

  // Ensure event exists
  await upsertEvent(fevoOffer, orgId);

  // Check if offer already exists by fevo_offer_id
  const existing = await db('offers')
    .where('fevo_offer_id', fevoOffer.offer_id)
    .first();

  if (existing) {
    // Update existing offer
    await db('offers')
      .where('id', existing.id)
      .update({
        title: fevoOffer.offer_title,
        date: fevoOffer.event_date_utc,
        checkout_url: checkoutUrl,
        fevo_url_code: fevoOffer.offer_url_code,
        fevo_synced_at: now,
        updated_at: now,
      });
    return 'updated';
  } else {
    // Create new offer
    const org = await db('organizations').where('id', orgId).first();
    await db('offers').insert({
      id: uuidv4(),
      title: fevoOffer.offer_title,
      description: null, // External API doesn't provide this — enriched via admin
      image_url: null,
      price_min: null,
      price_max: null,
      currency: 'USD',
      date: fevoOffer.event_date_utc,
      venue_name: null,
      venue_city: null,
      venue_state: null,
      availability: 'available',
      organization_id: orgId,
      organization_name: org?.name || null,
      checkout_url: checkoutUrl,
      tags: null,
      status: 'active',
      distribution_enabled: false,
      distribution_enabled_at: null,
      distribution_disabled_at: null,
      fevo_offer_id: fevoOffer.offer_id,
      fevo_url_code: fevoOffer.offer_url_code,
      event_id: null,
      venue_id: null,
      video_url: null,
      tickets_available: null,
      is_sold_out: false,
      source: 'fevo_sync',
      fevo_synced_at: now,
      created_at: now,
      updated_at: now,
    });
    return 'created';
  }
}

async function upsertEvent(
  fevoOffer: FevoExternalOffer,
  orgId: string
): Promise<void> {
  const now = new Date().toISOString();

  const existing = await db('events')
    .where('fevo_event_id', fevoOffer.event_id)
    .first();

  if (existing) {
    await db('events').where('id', existing.id).update({
      title: fevoOffer.event_title,
      date_utc: fevoOffer.event_date_utc,
      updated_at: now,
    });
  } else {
    await db('events').insert({
      id: uuidv4(),
      title: fevoOffer.event_title,
      fevo_event_id: fevoOffer.event_id,
      organization_id: orgId,
      venue_id: null,
      date_utc: fevoOffer.event_date_utc,
      date_timezone: null,
      created_at: now,
      updated_at: now,
    });
  }
}
