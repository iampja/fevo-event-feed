import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { Offer, Organization } from '../models/types';

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

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION-LEVEL DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════════

export interface OrgDistributionStatus {
  org_id: string;
  org_name: string;
  distribution_enabled: boolean;
  distribution_enabled_at: string | null;
  distribution_disabled_at: string | null;
  active_offer_count: number;
}

/**
 * Get the current distribution state for an organization.
 */
export async function getOrgDistributionStatus(orgId: string): Promise<OrgDistributionStatus | null> {
  const org: Organization | undefined = await db('organizations').where('id', orgId).first();
  if (!org) {
    return null;
  }

  const activeOfferCount = await db('offers')
    .where('organization_id', orgId)
    .where('status', 'active')
    .count('* as count')
    .first();

  return {
    org_id: orgId,
    org_name: org.name,
    distribution_enabled: !!org.distribution_enabled,
    distribution_enabled_at: org.distribution_enabled_at,
    distribution_disabled_at: org.distribution_disabled_at,
    active_offer_count: Number(activeOfferCount?.count ?? 0),
  };
}

/**
 * Enable distribution for an organization and cascade to all active offers.
 */
export async function enableOrgDistribution(orgId: string): Promise<OrgDistributionStatus> {
  return db.transaction(async (trx) => {
    const org: Organization | undefined = await trx('organizations').where('id', orgId).first();
    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const now = new Date().toISOString();

    await trx('organizations').where('id', orgId).update({
      distribution_enabled: true,
      distribution_enabled_at: now,
      updated_at: now,
    });

    // Enable distribution on all active offers under this org
    const activeOffers: { id: string }[] = await trx('offers')
      .where('organization_id', orgId)
      .where('status', 'active')
      .select('id');

    if (activeOffers.length > 0) {
      await trx('offers')
        .where('organization_id', orgId)
        .where('status', 'active')
        .update({
          distribution_enabled: true,
          distribution_enabled_at: now,
          updated_at: now,
        });

      // Remove 'inactive' exclusions for these offers
      const offerIds = activeOffers.map((o) => o.id);
      await trx('feed_exclusions')
        .whereIn('offer_id', offerIds)
        .where('reason', 'inactive')
        .del();
    }

    return {
      org_id: orgId,
      org_name: org.name,
      distribution_enabled: true,
      distribution_enabled_at: now,
      distribution_disabled_at: org.distribution_disabled_at,
      active_offer_count: activeOffers.length,
    };
  });
}

/**
 * Disable distribution for an organization and cascade to all offers.
 */
export async function disableOrgDistribution(orgId: string): Promise<OrgDistributionStatus> {
  return db.transaction(async (trx) => {
    const org: Organization | undefined = await trx('organizations').where('id', orgId).first();
    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const now = new Date().toISOString();

    await trx('organizations').where('id', orgId).update({
      distribution_enabled: false,
      distribution_disabled_at: now,
      updated_at: now,
    });

    // Disable distribution on all offers under this org
    const allOffers: { id: string }[] = await trx('offers')
      .where('organization_id', orgId)
      .where('distribution_enabled', true)
      .select('id');

    if (allOffers.length > 0) {
      await trx('offers')
        .where('organization_id', orgId)
        .where('distribution_enabled', true)
        .update({
          distribution_enabled: false,
          distribution_disabled_at: now,
          updated_at: now,
        });

      // Add exclusions for these offers
      const offerIds = allOffers.map((o) => o.id);
      const existingExclusions = await trx('feed_exclusions')
        .whereIn('offer_id', offerIds)
        .select('offer_id');
      const existingSet = new Set(existingExclusions.map((e: { offer_id: string }) => e.offer_id));

      const newExclusions = offerIds
        .filter((id) => !existingSet.has(id))
        .map((id) => ({
          id: uuidv4(),
          offer_id: id,
          reason: 'inactive' as const,
          excluded_at: now,
        }));

      if (newExclusions.length > 0) {
        await trx('feed_exclusions').insert(newExclusions);
      }
    }

    const activeOfferCount = await trx('offers')
      .where('organization_id', orgId)
      .where('status', 'active')
      .count('* as count')
      .first();

    return {
      org_id: orgId,
      org_name: org.name,
      distribution_enabled: false,
      distribution_enabled_at: org.distribution_enabled_at,
      distribution_disabled_at: now,
      active_offer_count: Number(activeOfferCount?.count ?? 0),
    };
  });
}
