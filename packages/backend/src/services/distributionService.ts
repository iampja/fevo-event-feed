import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { Offer } from '../models/types';

export interface DistributionStatus {
  offer_id: string;
  offer_title: string;
  offer_status: string;
  distribution_enabled: boolean;
  distribution_enabled_at: string | null;
  distribution_disabled_at: string | null;
}

/**
 * Enable distribution for an offer.
 * Validates that the offer exists and is active before enabling.
 * Wrapped in a transaction for atomicity.
 */
export async function enableDistribution(offerId: string): Promise<DistributionStatus> {
  return db.transaction(async (trx) => {
    const offer: Offer | undefined = await trx('offers').where('id', offerId).first();
    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    if (offer.status !== 'active') {
      throw new Error(`Cannot enable distribution for ${offer.status} offer. Offer must be active.`);
    }

    const now = new Date().toISOString();

    await trx('offers').where('id', offerId).update({
      distribution_enabled: true,
      distribution_enabled_at: now,
      updated_at: now,
    });

    // Remove any existing 'inactive' exclusion
    await trx('feed_exclusions')
      .where('offer_id', offerId)
      .where('reason', 'inactive')
      .del();

    return {
      offer_id: offerId,
      offer_title: offer.title,
      offer_status: offer.status,
      distribution_enabled: true,
      distribution_enabled_at: now,
      distribution_disabled_at: offer.distribution_disabled_at,
    };
  });
}

/**
 * Disable distribution for an offer.
 * Wrapped in a transaction for atomicity.
 */
export async function disableDistribution(offerId: string): Promise<DistributionStatus> {
  return db.transaction(async (trx) => {
    const offer: Offer | undefined = await trx('offers').where('id', offerId).first();
    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    const now = new Date().toISOString();

    await trx('offers').where('id', offerId).update({
      distribution_enabled: false,
      distribution_disabled_at: now,
      updated_at: now,
    });

    // Add exclusion if not already excluded
    const existing = await trx('feed_exclusions').where('offer_id', offerId).first();
    if (!existing) {
      await trx('feed_exclusions').insert({
        id: uuidv4(),
        offer_id: offerId,
        reason: 'inactive',
        excluded_at: now,
      });
    }

    return {
      offer_id: offerId,
      offer_title: offer.title,
      offer_status: offer.status,
      distribution_enabled: false,
      distribution_enabled_at: offer.distribution_enabled_at,
      distribution_disabled_at: now,
    };
  });
}

/**
 * Get the current distribution state for an offer.
 */
export async function getDistributionStatus(offerId: string): Promise<DistributionStatus | null> {
  const offer: Offer | undefined = await db('offers').where('id', offerId).first();
  if (!offer) {
    return null;
  }

  return {
    offer_id: offerId,
    offer_title: offer.title,
    offer_status: offer.status,
    distribution_enabled: !!offer.distribution_enabled,
    distribution_enabled_at: offer.distribution_enabled_at,
    distribution_disabled_at: offer.distribution_disabled_at,
  };
}
