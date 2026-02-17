import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { Kill, KillTargetType } from '../models/types';
import { addExclusion, removeExclusion } from './feedService';

/**
 * Kill a single offer: create a kill record and add an exclusion.
 * Wrapped in a transaction for atomicity.
 */
export async function killOffer(
  offerId: string,
  killedBy: string,
  reason?: string
): Promise<Kill> {
  return db.transaction(async (trx) => {
    // Verify offer exists
    const offer = await trx('offers').where('id', offerId).first();
    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    const kill: Kill = {
      id: uuidv4(),
      target_type: 'offer',
      target_id: offerId,
      killed_by: killedBy,
      killed_at: new Date().toISOString(),
      reason: reason || null,
      is_active: true,
      restored_by: null,
      restored_at: null,
    };

    await trx('event_feed_kills').insert({
      ...kill,
      is_active: 1,
    });

    // Add exclusion — use db directly since addExclusion manages its own queries
    const existingExclusion = await trx('feed_exclusions')
      .where('offer_id', offerId)
      .first();

    if (!existingExclusion) {
      await trx('feed_exclusions').insert({
        id: uuidv4(),
        offer_id: offerId,
        reason: 'killed',
        excluded_at: new Date().toISOString(),
      });
    }

    return kill;
  });
}

/**
 * Kill an entire organization: create a kill record for the org, then
 * add exclusions for every offer belonging to that org.
 * Wrapped in a transaction for atomicity.
 */
export async function killOrganization(
  orgId: string,
  killedBy: string,
  reason: string
): Promise<Kill> {
  return db.transaction(async (trx) => {
    // Verify organization has offers
    const orgOffers = await trx('offers')
      .where('organization_id', orgId)
      .select('id');

    if (orgOffers.length === 0) {
      throw new Error(`No offers found for organization: ${orgId}`);
    }

    const kill: Kill = {
      id: uuidv4(),
      target_type: 'organization',
      target_id: orgId,
      killed_by: killedBy,
      killed_at: new Date().toISOString(),
      reason,
      is_active: true,
      restored_by: null,
      restored_at: null,
    };

    await trx('event_feed_kills').insert({
      ...kill,
      is_active: 1,
    });

    // Add exclusions for all org offers
    for (const offer of orgOffers) {
      const existingExclusion = await trx('feed_exclusions')
        .where('offer_id', offer.id)
        .first();

      if (!existingExclusion) {
        await trx('feed_exclusions').insert({
          id: uuidv4(),
          offer_id: offer.id,
          reason: 'killed',
          excluded_at: new Date().toISOString(),
        });
      }
    }

    return kill;
  });
}

/**
 * Restore a kill: mark the kill as inactive, remove associated exclusions.
 * When restoring an org-level kill, only restore offers that aren't
 * individually killed by separate active kill records.
 * Wrapped in a transaction for atomicity.
 */
export async function restoreKill(
  killId: string,
  restoredBy: string
): Promise<Kill | null> {
  return db.transaction(async (trx) => {
    const killRecord = await trx('event_feed_kills').where('id', killId).first();
    if (!killRecord) {
      return null;
    }

    if (!killRecord.is_active) {
      throw new Error('Kill is already restored');
    }

    const now = new Date().toISOString();

    await trx('event_feed_kills').where('id', killId).update({
      is_active: 0,
      restored_by: restoredBy,
      restored_at: now,
    });

    if (killRecord.target_type === 'offer') {
      // Only remove exclusion if no other active kill targets this offer
      const otherKills = await trx('event_feed_kills')
        .where('target_id', killRecord.target_id)
        .where('target_type', 'offer')
        .where('is_active', 1)
        .whereNot('id', killId)
        .first();

      // Also check if this offer's org is killed
      const offer = await trx('offers').where('id', killRecord.target_id).first();
      let orgKilled = false;
      if (offer) {
        const orgKill = await trx('event_feed_kills')
          .where('target_id', offer.organization_id)
          .where('target_type', 'organization')
          .where('is_active', 1)
          .first();
        orgKilled = !!orgKill;
      }

      if (!otherKills && !orgKilled) {
        await trx('feed_exclusions')
          .where('offer_id', killRecord.target_id)
          .where('reason', 'killed')
          .del();
      }
    } else if (killRecord.target_type === 'organization') {
      // For org restore, only remove exclusions for offers NOT individually killed
      const orgOffers = await trx('offers')
        .where('organization_id', killRecord.target_id)
        .select('id');

      for (const offer of orgOffers) {
        // Check if this specific offer has its own active kill
        const individualKill = await trx('event_feed_kills')
          .where('target_id', offer.id)
          .where('target_type', 'offer')
          .where('is_active', 1)
          .first();

        if (!individualKill) {
          await trx('feed_exclusions')
            .where('offer_id', offer.id)
            .where('reason', 'killed')
            .del();
        }
      }
    }

    const updated = await trx('event_feed_kills').where('id', killId).first();
    return {
      ...updated,
      is_active: !!updated.is_active,
    } as Kill;
  });
}

/**
 * Get all currently active kills.
 */
export async function getActiveKills(): Promise<Kill[]> {
  const rows = await db('event_feed_kills').where('is_active', 1).orderBy('killed_at', 'desc');
  return rows.map((r: any) => ({
    ...r,
    is_active: !!r.is_active,
  })) as Kill[];
}

/**
 * Check whether a specific target is killed.
 */
export async function isKilled(
  targetType: KillTargetType,
  targetId: string
): Promise<boolean> {
  const row = await db('event_feed_kills')
    .where('target_type', targetType)
    .where('target_id', targetId)
    .where('is_active', 1)
    .first();

  return !!row;
}
